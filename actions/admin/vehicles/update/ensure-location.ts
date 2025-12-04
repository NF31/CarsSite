import prisma from '@/lib/prisma'
import type { UpdateVehicleResult } from "./types";

const PARIS_LOCATION_ID = "PARIS";

const DEFAULT_PARIS_LOCATION = {
  name: "Agence Paris",
  city: "Paris",
  address: "À définir",
  postalCode: "75000",
  country: "France",
  phone: "",
  email: "",
  active: true,
  openingHours: {
    monday: { open: "09:00", close: "18:00" },
    tuesday: { open: "09:00", close: "18:00" },
    wednesday: { open: "09:00", close: "18:00" },
    thursday: { open: "09:00", close: "18:00" },
    friday: { open: "09:00", close: "18:00" },
    saturday: { open: "09:00", close: "18:00" },
    sunday: { closed: true },
  },
};

export async function ensureLocation(
  locationId: string
): Promise<{ success: true; location: { id: string } } | UpdateVehicleResult> {
  // Vérifier que la localisation existe
  let location = await prisma.location.findUnique({
    where: { id: locationId },
  });

  // Si locationId = "PARIS" et que la location n'existe pas, créer Paris
  if (!location && locationId === PARIS_LOCATION_ID) {
    console.log("📍 DEBUG: Création de la location Paris car elle n'existe pas");
    location = await prisma.location.create({
      data: DEFAULT_PARIS_LOCATION,
    });
    console.log("📍 DEBUG: Location Paris créée avec l'ID:", location.id);
  }

  if (!location) {
    console.log("❌ DEBUG: Localisation introuvable - locationId:", locationId);
    return {
      success: false,
      error: "Localisation introuvable",
      fieldErrors: {
        locationId: ["Localisation introuvable"],
      },
    };
  }

  return {
    success: true,
    location: { id: location.id },
  };
}

