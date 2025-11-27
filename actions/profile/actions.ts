"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, deleteAccountSchema } from "@/lib/validations/profile";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateAccountDeletionToken } from "@/lib/account-deletion-token";
import { sendAccountDeletionEmail } from "@/lib/email";
import { getSignedDownloadUrl } from "@/lib/cloudinary";

export async function getProfileAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
        status: 401,
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        driverLicense: true,
        driverLicensePublicId: true,
        driverLicenseFileName: true,
        driverLicenseUploadCount: true,
        driverLicenseLastUploadedAt: true,
        emailVerified: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non trouvé ou compte supprimé",
        status: 404,
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Profile GET error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      status: 500,
    };
  }
}

export async function updateProfileAction(data: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
        status: 401,
      };
    }

    const validated = updateProfileSchema.parse(data);

    // Ne mettre à jour que les champs fournis (ne pas écraser le driverLicense)
    const updateData: {
      name: string;
      phone: string | null;
      image: string | null;
    } = {
      name: validated.name,
      phone: validated.phone || null,
      image: validated.image || null,
    };

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        driverLicense: true,
        driverLicensePublicId: true,
        driverLicenseFileName: true,
        driverLicenseUploadCount: true,
        driverLicenseLastUploadedAt: true,
        emailVerified: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: "Profil mis à jour avec succès",
      user,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Données invalides",
        details: error.issues,
        status: 400,
      };
    }

    console.error("Profile PUT error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      status: 500,
    };
  }
}

export async function deleteAccountAction(data: z.infer<typeof deleteAccountSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
        status: 401,
      };
    }

    const validated = deleteAccountSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
        status: 404,
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(validated.password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Mot de passe incorrect",
        status: 400,
      };
    }

    // Générer un token de confirmation
    const deletionToken = await generateAccountDeletionToken(user.id);

    // Envoyer l'email de confirmation
    try {
      await sendAccountDeletionEmail(user.email, user.name, deletionToken.token);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      await prisma.verificationToken.delete({
        where: { id: deletionToken.id },
      });
      return {
        success: false,
        error: "Erreur lors de l'envoi de l'email de confirmation",
        status: 500,
      };
    }

    return {
      success: true,
      message:
        "Un email de confirmation a été envoyé. Veuillez cliquer sur le lien dans l'email pour confirmer la suppression de votre compte.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Données invalides",
        details: error.issues,
        status: 400,
      };
    }

    console.error("Account deletion request error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      status: 500,
    };
  }
}

interface GetMyDriverLicenseUrlResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    fileName: string | null;
    expiresAt: number;
  };
  error?: string;
}

export async function getMyDriverLicenseUrlAction(
  expiresInSeconds?: number
): Promise<GetMyDriverLicenseUrlResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        driverLicense: true,
        driverLicensePublicId: true,
        driverLicenseFileName: true,
      },
    });

    if (!user?.driverLicense) {
      return {
        success: false,
        error: "Aucun permis n'est enregistré pour votre compte.",
      };
    }

    if (!user.driverLicensePublicId) {
      return {
        success: false,
        error: "Impossible de déterminer l'emplacement du permis.",
      };
    }
    
    const publicId = user.driverLicensePublicId;
    const expiresIn = Math.max(60, expiresInSeconds ?? 5 * 60);
    
    const signedUrl = getSignedDownloadUrl(publicId, "pdf", expiresIn, false);
    
    if (!signedUrl) {
      return {
        success: false,
        error: "Impossible de générer l'URL sécurisée.",
      };
    }
    
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    return {
      success: true,
      data: {
        url: signedUrl,
        publicId: user.driverLicensePublicId,
        fileName: user.driverLicenseFileName || null,
        expiresAt,
      },
    };
  } catch (error) {
    console.error("[Get My Driver License URL] Erreur:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la génération de l'URL sécurisée.",
    };
  }
}

