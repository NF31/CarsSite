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
 * Génère une URL signée pour télécharger un fichier privé depuis Cloudinary
 * @param publicId - Le public_id du fichier (avec dossier si applicable, ex: "vehicles/{vehicleId}/invoices/{userId}/invoice-XXX")
 * @param format - Le format du fichier (par défaut: "pdf")
 * @param expiresIn - Durée de validité en secondes (par défaut: 1 heure)
 * @returns URL signée valide pour le téléchargement
 */
export const getSignedDownloadUrl = (
  publicId: string,
  format: string = "pdf",
  expiresIn: number = 3600
): string => {
  // Retirer l'extension si présente et nettoyer le public_id
  // Le public_id doit inclure le dossier complet si présent
  const cleanPublicId = publicId.replace(/\.pdf$/, "");
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  // Pour les fichiers privés, utiliser cloudinary.utils.private_download_url()
  // Cette méthode génère une URL signée correcte pour les fichiers privés
  return cloudinary.utils.private_download_url(cleanPublicId, format, {
    resource_type: "raw",
    type: "private",
    expires_at: expiresAt,
  });
};

