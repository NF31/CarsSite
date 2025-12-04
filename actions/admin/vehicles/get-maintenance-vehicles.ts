"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MaintenanceStatus } from "@/lib/types/maintenance-status";
import { MaintenanceType } from "@/lib/types/maintenance-type";
import { VehicleStatus } from "@/lib/types/vehicle-status";

export interface MaintenanceVehicleOption {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  status: VehicleStatus;
  image?: string | null;
  location?: {
    id: string;
    name: string;
    city: string;
  } | null;
  activeMaintenances: number;
}

export interface GetMaintenanceVehicleOptionsResult {
  success: boolean;
  data?: MaintenanceVehicleOption[];
  error?: string;
}

export async function getMaintenanceVehicleOptionsAction(): Promise<GetMaintenanceVehicleOptionsResult> {
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

    const vehicles = await prisma.vehicle.findMany({
      orderBy: [
        { brand: "asc" },
        { model: "asc" },
      ],
      select: {
        id: true,
        brand: true,
        model: true,
        licensePlate: true,
        year: true,
        status: true,
        images: true,
        location: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        maintenances: {
          where: {
            status: {
              in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS],
            },
            type: {
              not: MaintenanceType.BLOCKED,
            },
          },
          select: { id: true },
        },
      },
    });

    const options: MaintenanceVehicleOption[] = vehicles.map((vehicle) => ({
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      year: vehicle.year,
      status: vehicle.status,
      image: vehicle.images?.[0] ?? null,
      location: vehicle.location,
      activeMaintenances: vehicle.maintenances.length,
    }));

    return {
      success: true,
      data: options,
    };
  } catch (error) {
    console.error("Error fetching maintenance vehicle options:", error);
    return {
      success: false,
      error: "Erreur lors du chargement des véhicules",
    };
  }
}

