import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateVerificationToken } from "@/lib/verification-token";
import { sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
      name: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(100, "Le nom ne peut pas dépasser 100 caractères"),
      email: z.string().email("Email invalide"),
      password: z
        .string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
      phone: z.string().optional(),
      acceptRGPD: z
        .boolean()
        .refine((val) => val === true, {
          message: "Vous devez consentir au traitement de vos données personnelles",
        }),
    });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email déjà utilisé",
          message: "Cet email est déjà associé à un compte",
        },
        { status: 400 }
      );
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
      emailError =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'email";
      // En mode développement, on peut retourner le token pour faciliter les tests
      // Ne pas bloquer la création du compte si l'email échoue
    }

    return NextResponse.json(
      {
        success: true,
        user,
        emailSent,
        emailError,
        // En mode développement seulement, retourner le token pour faciliter les tests
        ...(process.env.NODE_ENV === "development" && !emailSent
          ? { devToken: verificationToken.token }
          : {}),
        message: emailSent
          ? "Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte."
          : "Compte créé avec succès. Veuillez utiliser le lien de vérification ci-dessous.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur",
        message: "Une erreur est survenue lors de la création du compte",
      },
      { status: 500 }
    );
  }
}

