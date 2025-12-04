import type { UpdateVehicleInput } from "@/lib/validations/vehicle";
import type { UpdateVehicleResult } from "./types";

interface ValidationContext {
  updateData: Omit<UpdateVehicleInput, "id">;
  vehicleId: string;
  existingVehicle: {
    licensePlate: string;
  };
}

export function validatePriceCoherence(
  updateData: Omit<UpdateVehicleInput, "id">
): UpdateVehicleResult | null {
  // Vérifier que les prix sont cohérents
  if (updateData.pricePerWeek && updateData.pricePerWeek < updateData.pricePerDay * 5) {
    return {
      success: false,
      error: "Le prix par semaine doit être au moins 5 fois le prix par jour",
      fieldErrors: {
        pricePerWeek: ["Le prix par semaine doit être au moins 5 fois le prix par jour"],
      },
    };
  }

  if (updateData.pricePerMonth && updateData.pricePerMonth < updateData.pricePerDay * 25) {
    return {
      success: false,
      error: "Le prix par mois doit être au moins 25 fois le prix par jour",
      fieldErrors: {
        pricePerMonth: ["Le prix par mois doit être au moins 25 fois le prix par jour"],
      },
    };
  }

  // Vérifier que le dépôt n'est pas supérieur à 100 fois le prix par jour
  if (updateData.deposit > updateData.pricePerDay * 100) {
    return {
      success: false,
      error: "Le dépôt ne peut pas être supérieur à 100 fois le prix par jour",
      fieldErrors: {
        deposit: ["Le dépôt ne peut pas être supérieur à 100 fois le prix par jour"],
      },
    };
  }

  return null;
}

export function validateCloudinaryImages(
  images: string[]
): UpdateVehicleResult | null {
  const cloudinaryUrlPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.+/;
  
  for (const imageUrl of images) {
    if (!cloudinaryUrlPattern.test(imageUrl)) {
      return {
        success: false,
        error: "Toutes les images doivent provenir de Cloudinary",
        fieldErrors: {
          images: ["Une ou plusieurs images ne proviennent pas de Cloudinary"],
        },
      };
    }
  }

  return null;
}

export function validateFeatures(
  features: string[]
): UpdateVehicleResult | null {
  // Autorise les lettres, chiffres, espaces, tirets, apostrophes, & et points
  const dangerousPattern = /[<>\"%;()+]|&(?!amp;|nbsp;)/;
  
  for (const feature of features) {
    if (dangerousPattern.test(feature)) {
      return {
        success: false,
        error: "Les équipements contiennent des caractères invalides",
        fieldErrors: {
          features: ["Les équipements contiennent des caractères invalides"],
        },
      };
    }
  }

  return null;
}

export function validateDescription(
  description: string | null | undefined
): UpdateVehicleResult | null {
  if (!description) {
    return null;
  }

  const scriptPattern = /<script|javascript:|on\w+\s*=/i;
  if (scriptPattern.test(description)) {
    return {
      success: false,
      error: "La description contient du code potentiellement dangereux",
      fieldErrors: {
        description: ["La description contient du code potentiellement dangereux"],
      },
    };
  }

  return null;
}

export function validateMileage(
  mileage: number,
  year: number
): UpdateVehicleResult | null {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - year;
  const maxRealisticMileage = vehicleAge * 50000; // Maximum 50 000 km par an

  if (mileage > maxRealisticMileage && vehicleAge > 0) {
    return {
      success: false,
      error: `Le kilométrage semble irréaliste pour un véhicule de ${year} (maximum ${maxRealisticMileage.toLocaleString()} km attendu)`,
      fieldErrors: {
        mileage: [`Le kilométrage semble irréaliste pour un véhicule de ${year}`],
      },
    };
  }

  return null;
}

export async function validateLicensePlate(
  licensePlate: string,
  existingLicensePlate: string,
  vehicleId: string
): Promise<UpdateVehicleResult | null> {
  if (licensePlate === existingLicensePlate) {
    return null;
  }

  const prisma = (await import("@/lib/prisma")).default;
  const vehicleWithSamePlate = await prisma.vehicle.findUnique({
    where: { licensePlate },
  });

  if (vehicleWithSamePlate && vehicleWithSamePlate.id !== vehicleId) {
    return {
      success: false,
      error: "Un véhicule avec cette plaque d'immatriculation existe déjà",
      fieldErrors: {
        licensePlate: ["Cette plaque d'immatriculation est déjà utilisée"],
      },
    };
  }

  return null;
}

export async function validateVehicleUpdate(
  context: ValidationContext
): Promise<UpdateVehicleResult | null> {
  const { updateData, existingVehicle } = context;

  // Valider la cohérence des prix
  const priceValidation = validatePriceCoherence(updateData);
  if (priceValidation) return priceValidation;

  // Valider les images Cloudinary
  const imagesValidation = validateCloudinaryImages(updateData.images);
  if (imagesValidation) return imagesValidation;

  // Valider les équipements
  const featuresValidation = validateFeatures(updateData.features || []);
  if (featuresValidation) return featuresValidation;

  // Valider la description
  const descriptionValidation = validateDescription(updateData.description);
  if (descriptionValidation) return descriptionValidation;

  // Valider le kilométrage
  const mileageValidation = validateMileage(updateData.mileage, updateData.year);
  if (mileageValidation) return mileageValidation;

  // Valider la plaque d'immatriculation
  const licensePlateValidation = await validateLicensePlate(
    updateData.licensePlate,
    existingVehicle.licensePlate,
    context.vehicleId
  );
  if (licensePlateValidation) return licensePlateValidation;

  return null;
}

