import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/profile";
import bcrypt from "bcryptjs";

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
    const validated = changePasswordSchema.parse(body);

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(
      validated.newPassword,
      user.password
    );

    if (isSamePassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'ancien" },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

