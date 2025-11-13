"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BookingStatus, VehicleStatus } from "@prisma/client";

export interface FixVehicleStatusesResult {
  success: boolean;
  data?: {
    updated: number;
    vehicles: Array<{
      id: string;
      brand: string;
      model: string;
      licensePlate: string;
      oldStatus: string;
      newStatus: string;
    }>;
  };
  error?: string;
}

/**
 * Remet automatiquement en AVAILABLE les véhicules qui n'ont pas de réservations actives
 * et qui ne sont pas en maintenance
 */
export async function fixVehicleStatusesAction(): Promise<FixVehicleStatusesResult> {
  try {
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

    console.log("🔧 [FIX STATUS] Début de la correction des statuts de véhicules");

    // Récupérer tous les véhicules qui ne sont pas AVAILABLE
    const vehiclesToCheck = await prisma.vehicle.findMany({
      where: {
        status: {
          in: [VehicleStatus.RESERVED, VehicleStatus.UNAVAILABLE],
        },
      },
      select: {
        id: true,
        brand: true,
        model: true,
        licensePlate: true,
        status: true,
      },
    });

    console.log(`🔧 [FIX STATUS] ${vehiclesToCheck.length} véhicule(s) à vérifier`);

    const now = new Date();
    const updatedVehicles: FixVehicleStatusesResult["data"]["vehicles"] = [];
    let updatedCount = 0;

    for (const vehicle of vehiclesToCheck) {
      // Vérifier s'il y a des réservations actives (non annulées)
      const activeBookings = await prisma.booking.findMany({
        where: {
          vehicleId: vehicle.id,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
          },
          endDate: {
            gt: now, // La réservation n'est pas encore terminée
          },
        },
        select: {
          id: true,
          reference: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      });

      // Vérifier s'il y a des maintenances actives (non annulées)
      const activeMaintenances = await prisma.maintenance.findMany({
        where: {
          vehicleId: vehicle.id,
          status: {
            in: ["SCHEDULED", "IN_PROGRESS"],
          },
          endDate: {
            gt: now, // La maintenance n'est pas encore terminée
          },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          type: true,
        },
      });

      // Logs détaillés pour debug
      if (activeBookings.length > 0) {
        console.log(`   📅 Réservations actives trouvées pour ${vehicle.brand} ${vehicle.model}:`);
        activeBookings.forEach(b => {
          console.log(`      - ${b.reference} : ${b.startDate.toISOString()} → ${b.endDate.toISOString()} (${b.status})`);
        });
      }
      if (activeMaintenances.length > 0) {
        console.log(`   🔧 Maintenances actives trouvées pour ${vehicle.brand} ${vehicle.model}:`);
        activeMaintenances.forEach(m => {
          console.log(`      - ${m.type} : ${m.startDate.toISOString()} → ${m.endDate.toISOString()} (${m.status})`);
        });
      }

      // Si pas de réservations actives et pas de maintenances actives, remettre en AVAILABLE
      if (activeBookings.length === 0 && activeMaintenances.length === 0) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { status: VehicleStatus.AVAILABLE },
        });

        updatedVehicles.push({
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
          oldStatus: vehicle.status,
          newStatus: VehicleStatus.AVAILABLE,
        });

        updatedCount++;
        console.log(`✅ [FIX STATUS] ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) : ${vehicle.status} → AVAILABLE`);
      } else {
        const reasons = [];
        if (activeBookings.length > 0) {
          reasons.push(`${activeBookings.length} réservation(s) active(s)`);
        }
        if (activeMaintenances.length > 0) {
          reasons.push(`${activeMaintenances.length} maintenance(s) active(s)`);
        }
        console.log(`⏸️ [FIX STATUS] ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) : reste en ${vehicle.status} (${reasons.join(", ")})`);
      }
    }

    console.log(`🔧 [FIX STATUS] Correction terminée : ${updatedCount} véhicule(s) mis à jour`);

    return {
      success: true,
      data: {
        updated: updatedCount,
        vehicles: updatedVehicles,
      },
    };
  } catch (error) {
    console.error("❌ [FIX STATUS] Erreur lors de la correction des statuts:", error);
    return {
      success: false,
      error: "Erreur lors de la correction des statuts",
    };
  }
}

