import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/types/user-role";
import {
  USER_SELECT,
  VEHICLE_SELECT,
  LOCATION_SELECT,
  SERVICE_SELECT,
} from "./get-selects";

/**
 * Récupère toutes les données nécessaires pour les options de réservation
 */
export async function getBookingOptionsData() {
  const [users, vehicles, locations, services] = await Promise.all([
    prisma.user.findMany({
      where: {
        deletedAt: null,
        role: {
          in: [UserRole.CLIENT, UserRole.EMPLOYEE],
        },
      },
      orderBy: [
        {
          name: "asc",
        },
      ],
      select: USER_SELECT,
    }),
    prisma.vehicle.findMany({
      orderBy: [
        {
          brand: "asc",
        },
        {
          model: "asc",
        },
      ],
      select: VEHICLE_SELECT,
    }),
    prisma.location.findMany({
      where: { active: true },
      orderBy: [
        {
          city: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: LOCATION_SELECT,
    }),
    prisma.service.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          name: "asc",
        },
      ],
      select: SERVICE_SELECT,
    }),
  ]);

  return { users, vehicles, locations, services };
}

