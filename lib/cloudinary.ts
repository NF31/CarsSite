import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error("CLOUDINARY_CLOUD_NAME is not set");
}

if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error("CLOUDINARY_API_KEY is not set");
}

if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error("CLOUDINARY_API_SECRET is not set");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  format: string;
}

/**
 * Upload un PDF de facture de manière sécurisée vers Cloudinary
 * Le PDF est stocké en mode privé dans le dossier "vehicles/{vehicleId}/invoices/{userId}"
 * @param pdfBuffer - Le buffer du PDF à uploader
 * @param fileName - Nom optionnel du fichier (par défaut: timestamp)
 * @param vehicleId - ID du véhicule pour organiser dans vehicles/{vehicleId}/invoices
 * @param userId - ID de l'utilisateur pour organiser dans vehicles/{vehicleId}/invoices/{userId}
 * @returns Promise avec les détails de l'upload
 */
export const uploadPDF = async (
  pdfBuffer: Buffer,
  fileName?: string,
  vehicleId?: string,
  userId?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const defaultFileName = `facture${timestamp}`;
    const finalFileName = fileName || defaultFileName;

    // Construire le chemin du dossier : vehicles/{vehicleId}/invoices/{userId}
    let folder = "factures"; // Par défaut
    if (vehicleId && userId) {
      folder = `vehicles/${vehicleId}/invoices/${userId}`;
    } else if (vehicleId) {
      folder = `vehicles/${vehicleId}/invoices`;
    } else if (userId) {
      folder = `users/${userId}/invoices`;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: folder,
        type: "private", // Upload privé pour la sécurité
        public_id: finalFileName,
        format: "pdf", // Spécifier explicitement le format PDF
        overwrite: false, // Éviter l'écrasement accidentel
      },
      (error, result) => {
        if (error) {
          console.error("Erreur upload Cloudinary:", error);
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type || "raw",
            created_at: result.created_at || new Date().toISOString(),
            bytes: result.bytes || 0,
            format: result.format || "pdf",
          } as CloudinaryUploadResult);
        } else {
          reject(new Error("Résultat d'upload vide"));
        }
      }
    );

    // Convertir le buffer en stream et l'envoyer vers Cloudinary
    Readable.from(pdfBuffer).pipe(stream);
  });
};

/**
 * Upload un PDF de permis de conduire de manière sécurisée vers Cloudinary
 * Le PDF est stocké en mode privé dans le dossier "vehicles/users/{userId}/driver-license"
 * @param pdfBuffer - Le buffer du PDF à uploader
 * @param userId - ID de l'utilisateur pour organiser dans vehicles/users/{userId}/driver-license
 * @param userName - Nom optionnel de l'utilisateur pour le dossier
 * @param fileName - Nom optionnel du fichier (par défaut: timestamp)
 * @returns Promise avec les détails de l'upload
 */
export const uploadDriverLicensePDF = async (
  pdfBuffer: Buffer,
  userId: string,
  userName?: string | null,
  fileName?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const defaultFileName = fileName || `license-${timestamp}`;
    
    // Construire le dossier : vehicles/users/{userName}-{userId}/driver-license ou vehicles/users/{userId}/driver-license
    let folder = "vehicles/users";
    if (userName && userName.trim().length > 0) {
      const cleaned = userName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      if (cleaned.length > 0) {
        folder = `${folder}/${cleaned}-${userId}/driver-license`;
      } else {
        folder = `${folder}/${userId}/driver-license`;
      }
    } else {
      folder = `${folder}/${userId}/driver-license`;
    }

    console.log("[Cloudinary] ===== DÉBUT UPLOAD PERMIS =====");
    console.log("[Cloudinary] Paramètres d'upload:", {
      resource_type: "raw",
      folder: folder,
      type: "private",
      public_id: defaultFileName,
      format: "pdf",
      overwrite: false,
      userId,
      userName,
      bufferSize: pdfBuffer.length,
    });

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: folder,
        type: "private", // Upload privé pour la sécurité
        public_id: defaultFileName,
        format: "pdf", // Spécifier explicitement le format PDF
        overwrite: false, // Éviter l'écrasement accidentel
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] ❌ ERREUR upload permis:", {
            error: error.message,
            http_code: error.http_code,
            name: error.name,
            errorDetails: JSON.stringify(error, null, 2),
          });
          reject(error);
        } else if (result) {
          // IMPORTANT : Pour les fichiers privés (type: "private"), Cloudinary stocke le public_id AVEC l'extension
          // Le public_id retourné par Cloudinary inclut déjà l'extension : "license-1764075192344.pdf"
          // On doit le garder tel quel car c'est le vrai public_id utilisé par Cloudinary pour les fichiers privés
          const publicIdWithExtension = result.public_id;
          const hadExtension = publicIdWithExtension.endsWith(".pdf");
          
          console.log("[Cloudinary] ✅ Upload permis réussi:", {
            public_id_original: result.public_id,
            public_id_with_extension: publicIdWithExtension,
            hadExtension,
            secure_url: result.secure_url,
            folder: folder,
            type: "private",
            format: result.format || "pdf",
            bytes: result.bytes,
            created_at: result.created_at,
            resource_type: result.resource_type,
            width: result.width,
            height: result.height,
          });
          console.log("[Cloudinary] ===== FIN UPLOAD PERMIS =====");
          
          resolve({
            public_id: publicIdWithExtension, // AVEC extension car c'est le vrai public_id pour les fichiers privés
            secure_url: result.secure_url,
            resource_type: result.resource_type || "raw",
            created_at: result.created_at || new Date().toISOString(),
            bytes: result.bytes || 0,
            format: result.format || "pdf",
          } as CloudinaryUploadResult);
        } else {
          console.error("[Cloudinary] ❌ Résultat d'upload vide (result est null/undefined)");
          reject(new Error("Résultat d'upload vide"));
        }
      }
    );

    // Convertir le buffer en stream et l'envoyer vers Cloudinary
    Readable.from(pdfBuffer).pipe(stream);
  });
};

/**
 * Génère une URL signée pour télécharger un fichier privé depuis Cloudinary
 * @param publicId - Le public_id du fichier (avec dossier si applicable, ex: "vehicles/{vehicleId}/invoices/{userId}/invoice-XXX")
 * @param format - Le format du fichier (par défaut: "pdf")
 * @param expiresIn - Durée de validité en secondes (par défaut: 1 heure)
 * @param attachment - Si true, force le téléchargement en pièce jointe (par défaut: false)
 * @returns URL signée valide pour le téléchargement
 */
export const getSignedDownloadUrl = (
  publicId: string,
  format: string = "pdf",
  expiresIn: number = 3600,
  attachment: boolean = false
): string => {
  // IMPORTANT : Pour les fichiers privés, Cloudinary stocke le public_id AVEC l'extension
  // Il faut utiliser le public_id tel quel (avec extension) et ne PAS passer le format
  // car private_download_url() va utiliser le format depuis le public_id
  let publicIdForUrl = publicId;
  
  // Si le public_id n'a pas d'extension, on l'ajoute
  if (!publicIdForUrl.endsWith(`.${format}`)) {
    publicIdForUrl = `${publicIdForUrl}.${format}`;
  }
  
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  console.log("[getSignedDownloadUrl] Génération URL signée:", {
    publicId_original: publicId,
    publicId_with_extension: publicIdForUrl,
    format,
    expiresAt,
    attachment,
  });

  // Pour les fichiers privés, utiliser cloudinary.utils.private_download_url()
  // Passer le public_id AVEC extension et null pour le format (Cloudinary l'extrait du public_id)
  const options: {
    resource_type: string;
    type: string;
    expires_at: number;
    attachment?: boolean;
  } = {
    resource_type: "raw",
    type: "private",
    expires_at: expiresAt,
  };

  if (attachment) {
    options.attachment = true;
  }

  // Utiliser null pour le format car il est déjà dans le public_id
  const signedUrl = cloudinary.utils.private_download_url(publicIdForUrl, null, options);
  
  console.log("[getSignedDownloadUrl] URL signée générée:", signedUrl);
  
  return signedUrl;
};

