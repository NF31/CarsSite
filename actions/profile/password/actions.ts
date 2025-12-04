"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/profile";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function changePasswordAction(data: z.infer<typeof changePasswordSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Non autorisé",
        status: 401,
      };
    }

    const validated = changePasswordSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
        status: 404,
      };
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: "Mot de passe actuel incorrect",
        status: 400,
      };
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(validated.newPassword, user.password);

    if (isSamePassword) {
      return {
        success: false,
        error: "Le nouveau mot de passe doit être différent de l'ancien",
        status: 400,
      };
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: "Mot de passe modifié avec succès",
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

    console.error("Password change error:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
      status: 500,
    };
  }
}

