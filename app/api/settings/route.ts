import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  bookingReminders: z.boolean(),
  promotionalEmails: z.boolean(),
  marketingEmails: z.boolean(),
  language: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // Récupérer ou créer les préférences par défaut
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // Si pas de préférences, créer avec les valeurs par défaut
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: session.user.id,
          emailNotifications: true,
          bookingReminders: true,
          promotionalEmails: false,
          marketingEmails: false,
          language: "fr",
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = preferencesSchema.parse(body);

    // Mettre à jour ou créer les préférences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        emailNotifications: validated.emailNotifications,
        bookingReminders: validated.bookingReminders,
        promotionalEmails: validated.promotionalEmails,
        marketingEmails: validated.marketingEmails,
        language: validated.language || "fr",
      },
      create: {
        userId: session.user.id,
        emailNotifications: validated.emailNotifications,
        bookingReminders: validated.bookingReminders,
        promotionalEmails: validated.promotionalEmails,
        marketingEmails: validated.marketingEmails,
        language: validated.language || "fr",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Paramètres enregistrés avec succès",
      preferences,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

