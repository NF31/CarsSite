"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface MarkNotificationAsViewedResult {
  success: boolean;
  error?: string;
}

/**
 * Marque une notification de réservation comme vue par l'admin actuel
 */
export async function markNotificationAsViewedAction(
  bookingId: string
): Promise<MarkNotificationAsViewedResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Vous devez être connecté.",
      };
    }

    // Vérifier que l'utilisateur est un admin
    if (session.user.role !== "ADMIN" && session.user.role !== "EMPLOYEE") {
      return {
        success: false,
        error: "Accès refusé. Seuls les administrateurs peuvent marquer les notifications comme vues.",
      };
    }

    // Vérifier que la réservation existe
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true },
    });

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Créer ou mettre à jour l'enregistrement de visualisation
    await prisma.adminNotificationView.upsert({
      where: {
        adminId_bookingId: {
          adminId: session.user.id,
          bookingId: bookingId,
        },
      },
      create: {
        adminId: session.user.id,
        bookingId: bookingId,
      },
      update: {
        viewedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Admin Notifications] Erreur lors du marquage de la notification comme vue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

