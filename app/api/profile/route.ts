import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        driverLicense: true,
        emailVerified: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile GET error:", error);
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
    const validated = updateProfileSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name,
        phone: validated.phone || null,
        image: validated.image || null,
        driverLicense: validated.driverLicense || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        driverLicense: true,
        emailVerified: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil mis à jour avec succès",
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}

