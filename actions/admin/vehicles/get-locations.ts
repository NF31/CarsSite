"use server";

import { prisma } from "@/lib/prisma";

export async function getLocationsAction() {
  try {
    const locations = await prisma.location.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: locations,
    };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return {
      success: false,
      data: [],
      error: "Erreur lors de la récupération des localisations",
    };
  }
}

