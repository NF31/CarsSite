"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/cloudinary";
import { redirect } from "next/navigation";

interface GetDriverLicenseUrlInput {
  userId: string;
  expiresInSeconds?: number;
  attachment?: boolean;
}

interface GetDriverLicenseUrlResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    fileName: string | null;
    expiresAt: number;
  };
  error?: string;
}

export async function getDriverLicenseUrlAction(
  input: GetDriverLicenseUrlInput
): Promise<GetDriverLicenseUrlResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Accès refusé.",
      };
    }

    if (!input.userId || input.userId.trim().length === 0) {
      return {
        success: false,
        error: "Client invalide.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { 
        driverLicense: true,
        driverLicensePublicId: true,
        driverLicenseFileName: true,
      },
    });

    if (!user?.driverLicense) {
      return {
        success: false,
        error: "Aucun permis n'est enregistré pour ce client.",
      };
    }

    // Vérifier si c'est un fichier public ou privé
    const isPublicFile = user.driverLicense?.includes("/raw/upload/") && !user.driverLicense?.includes("/private/");

    // Pour les fichiers publics, utiliser directement l'URL originale stockée
    if (isPublicFile && user.driverLicense) {
      // Extraire le publicId pour le retour
      const { extractCloudinaryAssetInfo } = await import("@/lib/cloudinary-utils");
      const info = extractCloudinaryAssetInfo(user.driverLicense);
      
      // Utiliser directement l'URL originale qui devrait fonctionner
      const publicUrl = user.driverLicense;
      const publicIdWithExtension = info ? `${info.publicId}.${info.format}` : (user.driverLicensePublicId || "unknown");
      
      const expiresAt = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 an pour les fichiers publics
      
      return {
        success: true,
        data: {
          url: publicUrl,
          publicId: publicIdWithExtension,
          fileName: user.driverLicenseFileName || null,
          expiresAt,
        },
      };
    }

    // Pour les fichiers privés, utiliser getSignedDownloadUrl
    let publicId = user.driverLicensePublicId;
    
    if (!publicId && user.driverLicense) {
      const { extractCloudinaryAssetInfo } = await import("@/lib/cloudinary-utils");
      const info = extractCloudinaryAssetInfo(user.driverLicense);
      if (info) {
        // Pour les fichiers privés, le publicId doit inclure l'extension
        publicId = `${info.publicId}.${info.format}`;
      }
    }

    if (!publicId) {
      return {
        success: false,
        error: "Impossible de déterminer l'emplacement du permis.",
      };
    }
    
    const expiresInSeconds = Math.max(60, input.expiresInSeconds ?? 5 * 60);
    
    // Générer une nouvelle URL signée valide pour les fichiers privés
    const signedUrl = getSignedDownloadUrl(publicId, "pdf", expiresInSeconds, input.attachment ?? false);
    
    if (!signedUrl) {
      return {
        success: false,
        error: "Impossible de générer l'URL sécurisée.",
      };
    }
    
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return {
      success: true,
      data: {
        url: signedUrl,
        publicId: publicId,
        fileName: user.driverLicenseFileName || null,
        expiresAt,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 1000),
    } : { error: String(error) };
    
    console.error("[Get Driver License URL] ❌❌❌ ERREUR GLOBALE:", {
      error: errorMessage,
      errorDetails,
      userId: input.userId,
    });
    return {
      success: false,
      error: "Une erreur est survenue lors de la génération de l'URL sécurisée.",
    };
  }
}


