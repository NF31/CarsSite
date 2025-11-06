import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteAccountSchema } from "@/lib/validations/profile";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateAccountDeletionToken } from "@/lib/account-deletion-token";
import { sendAccountDeletionEmail } from "@/lib/email";

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
        name: true,
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

    // Générer un token de confirmation de suppression
    const deletionToken = await generateAccountDeletionToken(user.id);

    // Envoyer l'email de confirmation
    try {
      await sendAccountDeletionEmail(
        user.email,
        user.name,
        deletionToken.token
      );
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // Supprimer le token si l'email n'a pas pu être envoyé
      await prisma.verificationToken.delete({
        where: { id: deletionToken.id },
      });
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email de confirmation" },
        { status: 500 }
      );
    }

    // Retourner un succès (mais le compte n'est pas encore supprimé)
    return NextResponse.json({
      success: true,
      message: "Un email de confirmation a été envoyé. Veuillez cliquer sur le lien dans l'email pour confirmer la suppression de votre compte.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Account deletion request error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

