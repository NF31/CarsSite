"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { redirect } from "next/navigation";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";

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
      select: { driverLicense: true },
    });

    if (!user?.driverLicense) {
      return {
        success: false,
        error: "Aucun permis n'est enregistré pour ce client.",
      };
    }

    const assetInfo = extractCloudinaryAssetInfo(user.driverLicense);

    if (!assetInfo) {
      return {
        success: false,
        error: "Impossible de déterminer l'emplacement du permis.",
      };
    }

    const expiresInSeconds = Math.max(60, input.expiresInSeconds ?? 5 * 60);
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    const signedUrl = cloudinary.utils.private_download_url(assetInfo.publicId, assetInfo.format, {
      resource_type: "raw",
      type: "authenticated",
      expires_at: expiresAt,
      ...(input.attachment ? { attachment: true } : {}),
    });

    if (!signedUrl) {
      return {
        success: false,
        error: "Impossible de générer l'URL sécurisée.",
      };
    }

    return {
      success: true,
      data: {
        url: signedUrl,
        publicId: `${assetInfo.publicId}.${assetInfo.format}`,
        expiresAt,
      },
    };
  } catch (error) {
    console.error("Get driver license URL error:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la génération de l'URL sécurisée.",
    };
  }
}


