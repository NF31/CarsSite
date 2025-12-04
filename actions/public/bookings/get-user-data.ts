"use server";

import { auth } from "@/auth";
import prisma from '@/lib/prisma'

export interface GetUserDataResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    driverLicenseUrl: string | null;
    termsAccepted: boolean; // Si l'utilisateur a déjà accepté les CGV
  };
  error?: string;
}

/**
 * Récupère les données de l'utilisateur connecté pour pré-remplir le formulaire de booking
 */
export async function getUserDataForBookingAction(): Promise<GetUserDataResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Non authentifié",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        driverLicense: true,
        termsAcceptedAt: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Utilisateur introuvable",
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        driverLicenseUrl: user.driverLicense,
        termsAccepted: user.termsAcceptedAt !== null, // Accepté si une date existe
      },
    };
  } catch (error) {
    console.error("[Public Booking] Erreur lors de la récupération des données utilisateur", error);
    return {
      success: false,
      error: "Impossible de récupérer les données utilisateur",
    };
  }
}

