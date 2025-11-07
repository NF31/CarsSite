"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MaintenanceType } from "@prisma/client";

export interface BlockDatesResult {
  success: boolean;
  error?: string;
  warning?: string; // Avertissement informatif (pas une erreur)
  fieldErrors?: Record<string, string[]>;
}

/**
 * Bloque des dates pour un véhicule en créant une maintenance de type "BLOCKED"
 * ou en mettant le statut du véhicule à UNAVAILABLE
 */
export async function blockVehicleDatesAction(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  reason?: string
): Promise<BlockDatesResult> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    if (!vehicleId || vehicleId.trim() === "") {
      return {
        success: false,
        error: "ID du véhicule requis",
        fieldErrors: {
          vehicleId: ["L'ID du véhicule est requis"],
        },
      };
    }

    if (!startDate || !endDate) {
      return {
        success: false,
        error: "Les dates de début et de fin sont requises",
        fieldErrors: {
          dates: ["Les dates sont requises"],
        },
      };
    }

    if (endDate <= startDate) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début",
        fieldErrors: {
          dates: ["La date de fin doit être postérieure à la date de début"],
        },
      };
    }

    // Vérifier que le véhicule existe
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        bookings: {
          where: {
            status: {
              not: "CANCELLED",
            },
            OR: [
              {
                startDate: {
                  lte: endDate,
                },
                endDate: {
                  gte: startDate,
                },
              },
            ],
          },
        },
        maintenances: {
          where: {
            type: MaintenanceType.BLOCKED,
            status: {
              not: "CANCELLED",
            },
            OR: [
              {
                startDate: {
                  lte: endDate,
                },
                endDate: {
                  gte: startDate,
                },
              },
            ],
          },
        },
      },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Véhicule introuvable",
        fieldErrors: {
          vehicleId: ["Véhicule introuvable"],
        },
      };
    }

    // Vérifier s'il y a des réservations en conflit
    if (vehicle.bookings.length > 0) {
      return {
        success: false,
        error: "Impossible de bloquer ces dates car il y a des réservations actives sur cette période",
        fieldErrors: {
          dates: [`${vehicle.bookings.length} réservation(s) active(s) sur cette période`],
        },
      };
    }

    // Vérifier s'il y a déjà des blocages sur cette période (avertissement informatif)
    // On permet les chevauchements mais on les note pour information
    const existingBlocks = vehicle.maintenances || [];
    let warning: string | undefined;
    if (existingBlocks.length > 0) {
      warning = `ℹ️ ${existingBlocks.length} blocage(s) existant(s) sur cette période. Les chevauchements sont autorisés et seront affichés dans le calendrier.`;
      console.log(warning);
    }

    // Créer une maintenance de type "BLOCKED" pour bloquer les dates
    // Note: Les chevauchements de blocages sont autorisés car ils peuvent avoir des raisons différentes
    await prisma.maintenance.create({
      data: {
        vehicleId,
        type: MaintenanceType.BLOCKED,
        status: "SCHEDULED",
        startDate,
        endDate,
        description: reason || "Dates bloquées par l'administrateur",
        cost: 0,
        notes: "Blocage de dates pour indisponibilité temporaire",
      },
    });

    return {
      success: true,
      warning, // Retourner l'avertissement si présent
    };
  } catch (error) {
    console.error("Error blocking vehicle dates:", error);
    
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return {
        success: false,
        error: "Erreur lors du blocage des dates",
      };
    }

    return {
      success: false,
      error: "Erreur lors du blocage des dates",
    };
  }
}

/**
 * Met à jour les dates d'une maintenance de blocage
 */
export async function updateBlockedDatesAction(
  maintenanceId: string,
  startDate: Date,
  endDate: Date,
  reason?: string
): Promise<BlockDatesResult> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    if (!maintenanceId || maintenanceId.trim() === "") {
      return {
        success: false,
        error: "ID de maintenance requis",
        fieldErrors: {
          maintenanceId: ["L'ID de maintenance est requis"],
        },
      };
    }

    if (!startDate || !endDate) {
      return {
        success: false,
        error: "Les dates de début et de fin sont requises",
        fieldErrors: {
          dates: ["Les dates sont requises"],
        },
      };
    }

    if (endDate <= startDate) {
      return {
        success: false,
        error: "La date de fin doit être postérieure à la date de début",
        fieldErrors: {
          dates: ["La date de fin doit être postérieure à la date de début"],
        },
      };
    }

    // Récupérer la maintenance pour obtenir le vehicleId
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        vehicle: {
          include: {
            bookings: {
              where: {
                status: {
                  not: "CANCELLED",
                },
                OR: [
                  {
                    startDate: {
                      lte: endDate,
                    },
                    endDate: {
                      gte: startDate,
                    },
                  },
                ],
              },
            },
            maintenances: {
              where: {
                type: MaintenanceType.BLOCKED,
                status: {
                  not: "CANCELLED",
                },
                id: {
                  not: maintenanceId, // Exclure la maintenance actuelle
                },
                OR: [
                  {
                    startDate: {
                      lte: endDate,
                    },
                    endDate: {
                      gte: startDate,
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });

    if (!maintenance) {
      return {
        success: false,
        error: "Maintenance introuvable",
        fieldErrors: {
          maintenanceId: ["Maintenance introuvable"],
        },
      };
    }

    if (maintenance.type !== MaintenanceType.BLOCKED) {
      return {
        success: false,
        error: "Cette maintenance n'est pas un blocage de dates",
      };
    }

    // Vérifier s'il y a des réservations en conflit (en excluant la maintenance actuelle)
    const conflictingBookings = maintenance.vehicle.bookings.filter(
      (booking) => {
        // Vérifier si la réservation chevauche les nouvelles dates
        return (
          (booking.startDate <= endDate && booking.endDate >= startDate)
        );
      }
    );

    if (conflictingBookings.length > 0) {
      return {
        success: false,
        error: "Impossible de modifier ces dates car il y a des réservations actives sur cette période",
        fieldErrors: {
          dates: [`${conflictingBookings.length} réservation(s) active(s) sur cette période`],
        },
      };
    }

    // Vérifier s'il y a déjà d'autres blocages sur cette période (avertissement informatif)
    const existingBlocks = maintenance.vehicle.maintenances || [];
    let warning: string | undefined;
    if (existingBlocks.length > 0) {
      warning = `ℹ️ ${existingBlocks.length} autre(s) blocage(s) existant(s) sur cette période. Les chevauchements sont autorisés et seront affichés dans le calendrier.`;
      console.log(warning);
    }

    // Mettre à jour la maintenance
    await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: {
        startDate,
        endDate,
        description: reason || maintenance.description || "Dates bloquées par l'administrateur",
      },
    });

    return {
      success: true,
      warning, // Retourner l'avertissement si présent
    };
  } catch (error) {
    console.error("Error updating blocked dates:", error);
    return {
      success: false,
      error: "Erreur lors de la modification des dates",
    };
  }
}

/**
 * Débloque des dates en supprimant ou annulant la maintenance de blocage
 */
export async function unblockVehicleDatesAction(
  maintenanceId: string
): Promise<BlockDatesResult> {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires",
      };
    }

    if (!maintenanceId || maintenanceId.trim() === "") {
      return {
        success: false,
        error: "ID de maintenance requis",
      };
    }

    // Annuler la maintenance (changer le statut à CANCELLED plutôt que de supprimer)
    await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error unblocking vehicle dates:", error);
    return {
      success: false,
      error: "Erreur lors du déblocage des dates",
    };
  }
}

