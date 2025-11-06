"use server";

import { prisma } from "@/lib/prisma";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export interface CreateVehicleResult {
  success: boolean;
  data?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createVehicleAction(
  input: CreateVehicleInput
): Promise<CreateVehicleResult> {
  try {
    // Vérifier l'authentification et le rôle
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

    // Valider les données
    const validationResult = createVehicleSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        success: false,
        error: "Données invalides",
        fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // VALIDATIONS SUPPLÉMENTAIRES DE SÉCURITÉ
    
    // Vérifier que les prix sont cohérents
    if (validatedData.pricePerWeek && validatedData.pricePerWeek < validatedData.pricePerDay * 5) {
      return {
        success: false,
        error: "Le prix par semaine doit être au moins 5 fois le prix par jour",
        fieldErrors: {
          pricePerWeek: ["Le prix par semaine doit être au moins 5 fois le prix par jour"],
        },
      };
    }

    if (validatedData.pricePerMonth && validatedData.pricePerMonth < validatedData.pricePerDay * 25) {
      return {
        success: false,
        error: "Le prix par mois doit être au moins 25 fois le prix par jour",
        fieldErrors: {
          pricePerMonth: ["Le prix par mois doit être au moins 25 fois le prix par jour"],
        },
      };
    }

    // Vérifier que le dépôt n'est pas supérieur à 100 fois le prix par jour
    // (augmenté pour permettre des dépôts plus élevés pour les véhicules de luxe)
    if (validatedData.deposit > validatedData.pricePerDay * 100) {
      return {
        success: false,
        error: "Le dépôt ne peut pas être supérieur à 100 fois le prix par jour",
        fieldErrors: {
          deposit: ["Le dépôt ne peut pas être supérieur à 100 fois le prix par jour"],
        },
      };
    }

    // Vérifier que toutes les URLs d'images sont bien des URLs Cloudinary valides
    const cloudinaryUrlPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.+/;
    for (const imageUrl of validatedData.images) {
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

    // Vérifier que les équipements ne contiennent pas de caractères dangereux
    const dangerousPattern = /[<>\"'%;()&+]/;
    for (const feature of validatedData.features) {
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

    // Vérifier que la description ne contient pas de caractères dangereux si elle existe
    if (validatedData.description) {
      const scriptPattern = /<script|javascript:|on\w+\s*=/i;
      if (scriptPattern.test(validatedData.description)) {
        return {
          success: false,
          error: "La description contient du code potentiellement dangereux",
          fieldErrors: {
            description: ["La description contient du code potentiellement dangereux"],
          },
        };
      }
    }

    // Vérifier que la plaque d'immatriculation n'est pas déjà utilisée (déjà fait plus bas, mais on le garde)
    // Vérifier que le kilométrage est réaliste par rapport à l'année
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - validatedData.year;
    const maxRealisticMileage = vehicleAge * 50000; // Maximum 50 000 km par an
    if (validatedData.mileage > maxRealisticMileage && vehicleAge > 0) {
      return {
        success: false,
        error: `Le kilométrage semble irréaliste pour un véhicule de ${validatedData.year} (maximum ${maxRealisticMileage.toLocaleString()} km attendu)`,
        fieldErrors: {
          mileage: [`Le kilométrage semble irréaliste pour un véhicule de ${validatedData.year}`],
        },
      };
    }

    // LOG COMPLET DES DONNÉES VALIDÉES
    console.log("📋 DEBUG SERVER ACTION - Données validées:", {
      brand: validatedData.brand,
      model: validatedData.model,
      year: validatedData.year,
      licensePlate: validatedData.licensePlate,
      mileage: validatedData.mileage,
      category: validatedData.category,
      seats: validatedData.seats,
      transmission: validatedData.transmission,
      fuelType: validatedData.fuelType,
      color: validatedData.color,
      pricePerDay: validatedData.pricePerDay,
      pricePerWeek: validatedData.pricePerWeek,
      pricePerMonth: validatedData.pricePerMonth,
      deposit: validatedData.deposit,
      locationId: validatedData.locationId,
      features: validatedData.features,
      images: validatedData.images,
      imagesCount: validatedData.images?.length,
      description: validatedData.description,
      allData: validatedData,
    });

    // Vérifier que la plaque d'immatriculation est unique
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: validatedData.licensePlate },
    });

    if (existingVehicle) {
      return {
        success: false,
        error: "Un véhicule avec cette plaque d'immatriculation existe déjà",
        fieldErrors: {
          licensePlate: ["Cette plaque d'immatriculation est déjà utilisée"],
        },
      };
    }

    // Vérifier que la localisation existe, sinon créer Paris si locationId = "PARIS"
    let location = await prisma.location.findUnique({
      where: { id: validatedData.locationId },
    });

    // Si locationId = "PARIS" et que la location n'existe pas, créer Paris
    if (!location && validatedData.locationId === "PARIS") {
      console.log("📍 DEBUG: Création de la location Paris car elle n'existe pas");
      location = await prisma.location.create({
        data: {
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
        },
      });
      console.log("📍 DEBUG: Location Paris créée avec l'ID:", location.id);
    }

    if (!location) {
      console.log("❌ DEBUG: Localisation introuvable - locationId:", validatedData.locationId);
      return {
        success: false,
        error: "Localisation introuvable",
        fieldErrors: {
          locationId: ["Localisation introuvable"],
        },
      };
    }

    // Créer le véhicule
    const vehicle = await prisma.vehicle.create({
      data: {
        brand: validatedData.brand,
        model: validatedData.model,
        year: validatedData.year,
        licensePlate: validatedData.licensePlate,
        mileage: validatedData.mileage,
        category: validatedData.category,
        seats: validatedData.seats,
        transmission: validatedData.transmission,
        fuelType: validatedData.fuelType,
        color: validatedData.color,
        pricePerDay: validatedData.pricePerDay,
        pricePerWeek: validatedData.pricePerWeek,
        pricePerMonth: validatedData.pricePerMonth,
        deposit: validatedData.deposit,
        locationId: location.id, // Utiliser l'ID réel de la location (créée ou existante)
        features: validatedData.features || [],
        images: validatedData.images,
        imagePublicIds: validatedData.imagePublicIds || [],
        description: validatedData.description,
        status: "AVAILABLE", // Par défaut, le véhicule est disponible
      },
    });

    return {
      success: true,
      data: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
      },
    };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return {
      success: false,
      error: "Erreur lors de la création du véhicule",
    };
  }
}

