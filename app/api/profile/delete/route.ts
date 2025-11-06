import { NextRequest, NextResponse } from "next/server";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteAccountSchema } from "@/lib/validations/profile";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = deleteAccountSchema.parse(body);

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      validated.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur (cascade supprimera les réservations, avis, etc.)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // Déconnecter l'utilisateur
    await signOut({ redirect: false });

    return NextResponse.json({
      success: true,
      message: "Compte supprimé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

