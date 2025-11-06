"use server";

import { prisma } from "@/lib/prisma";

export async function getBrandsAction() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: {
        brand: true,
      },
      distinct: ["brand"],
      orderBy: {
        brand: "asc",
      },
    });

    const brands = vehicles.map((v) => v.brand);

    return {
      success: true,
      data: brands,
    };
  } catch (error) {
    console.error("Error fetching brands:", error);
    return {
      success: false,
      data: [],
      error: "Erreur lors de la récupération des marques",
    };
  }
}

