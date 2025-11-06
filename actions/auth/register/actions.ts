"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations/auth";

export async function registerAction(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse(data);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email déjà utilisé",
        message: "Cet email est déjà associé à un compte",
      };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        phone: validated.phone,
        role: "CLIENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Générer le token de vérification
    const verificationToken = await generateVerificationToken(user.email);

    // Envoyer l'email de vérification
    let emailSent = false;
    let emailError: string | null = null;

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken.token);
      emailSent = true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      emailError = error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email";
    }

    return {
      success: true,
      user,
      emailSent,
      emailError,
      ...(process.env.NODE_ENV === "development" && !emailSent
        ? { devToken: verificationToken.token }
        : {}),
      message: emailSent
        ? "Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte."
        : "Compte créé avec succès. Veuillez utiliser le lien de vérification ci-dessous.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      };
    }

    console.error("Registration error:", error);
    return {
      success: false,
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la création du compte",
    };
  }
}

