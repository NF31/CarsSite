import { z } from "zod";
import type { VehicleCategory, TransmissionType, FuelType } from "@prisma/client";

export const createVehicleSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, "La marque est requise")
    .max(50, "La marque ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-zÀ-ÿ0-9\s\-'&.]+$/, "La marque contient des caractères invalides")
    .refine((val) => val.length >= 2, "La marque doit contenir au moins 2 caractères"),
  model: z
    .string()
    .trim()
    .min(1, "Le modèle est requis")
    .max(50, "Le modèle ne peut pas dépasser 50 caractères")
    .regex(/^[A-Za-zÀ-ÿ0-9\s\-'&.]+$/, "Le modèle contient des caractères invalides")
    .refine((val) => val.length >= 1, "Le modèle doit contenir au moins 1 caractère"),
  year: z
    .number()
    .int("L'année doit être un nombre entier")
    .min(1900, "L'année doit être supérieure à 1900")
    .max(new Date().getFullYear() + 1, "L'année ne peut pas être dans le futur")
    .refine((val) => val >= 1900 && val <= new Date().getFullYear() + 1, "Année invalide"),
  licensePlate: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "La plaque d'immatriculation doit contenir au moins 2 caractères")
    .max(20, "La plaque ne peut pas dépasser 20 caractères")
    .regex(/^[A-Z0-9\s\-]+$/, "Format de plaque invalide (uniquement lettres, chiffres, espaces et tirets)")
    .refine((val) => {
      // Vérifier qu'il y a au moins une lettre et un chiffre
      const hasLetter = /[A-Z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      return hasLetter && hasNumber;
    }, "La plaque doit contenir au moins une lettre et un chiffre"),
  mileage: z
    .number()
    .int("Le kilométrage doit être un nombre entier")
    .min(0, "Le kilométrage ne peut pas être négatif")
    .max(1000000, "Le kilométrage ne peut pas dépasser 1 000 000 km")
    .refine((val) => val >= 0 && val <= 1000000, "Kilométrage invalide"),
  category: z.enum(["ECONOMY", "COMPACT", "MID_SIZE", "FULL_SIZE", "SUV", "LUXURY", "VAN"], {
    required_error: "La catégorie est requise",
    invalid_type_error: "Catégorie invalide",
  }),
  seats: z
    .number()
    .int("Le nombre de places doit être un nombre entier")
    .min(2, "Le véhicule doit avoir au moins 2 places")
    .max(9, "Le véhicule ne peut pas avoir plus de 9 places")
    .refine((val) => val >= 2 && val <= 9, "Nombre de places invalide"),
  transmission: z.enum(["MANUAL", "AUTOMATIC"], {
    required_error: "Le type de transmission est requis",
    invalid_type_error: "Type de transmission invalide",
  }),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID"], {
    required_error: "Le type de carburant est requis",
    invalid_type_error: "Type de carburant invalide",
  }),
  color: z
    .string()
    .trim()
    .min(1, "La couleur est requise")
    .max(30, "La couleur ne peut pas dépasser 30 caractères")
    .regex(/^[A-Za-zÀ-ÿ\s\-]+$/, "La couleur contient des caractères invalides")
    .refine((val) => val.length >= 2, "La couleur doit contenir au moins 2 caractères"),
  pricePerDay: z
    .number()
    .positive("Le prix par jour doit être positif")
    .min(1, "Le prix par jour doit être d'au moins 1€")
    .max(10000, "Le prix par jour ne peut pas dépasser 10 000€")
    .refine((val) => Number.isFinite(val) && val > 0, "Prix par jour invalide"),
  pricePerWeek: z
    .number()
    .positive("Le prix par semaine doit être positif")
    .min(1, "Le prix par semaine doit être d'au moins 1€")
    .max(50000, "Le prix par semaine ne peut pas dépasser 50 000€")
    .refine((val) => Number.isFinite(val) && val > 0, "Prix par semaine invalide")
    .optional(),
  pricePerMonth: z
    .number()
    .positive("Le prix par mois doit être positif")
    .min(1, "Le prix par mois doit être d'au moins 1€")
    .max(200000, "Le prix par mois ne peut pas dépasser 200 000€")
    .refine((val) => Number.isFinite(val) && val > 0, "Prix par mois invalide")
    .optional(),
  deposit: z
    .number()
    .min(0, "Le dépôt ne peut pas être négatif")
    .max(10000, "Le dépôt ne peut pas dépasser 10 000€")
    .refine((val) => Number.isFinite(val) && val >= 0, "Dépôt invalide"),
  locationId: z
    .string()
    .trim()
    .min(1, "La localisation est requise")
    .refine((val) => val.length > 0 && val.length <= 100, "ID de localisation invalide"),
  features: z
    .array(z.string().trim().min(1).max(100))
    .max(50, "Maximum 50 équipements autorisés")
    .default([])
    .refine((val) => {
      // Vérifier qu'il n'y a pas de doublons
      const unique = new Set(val);
      return unique.size === val.length;
    }, "Les équipements ne doivent pas contenir de doublons"),
  images: z
    .array(
      z
        .string()
        .url("Chaque image doit être une URL valide")
        .refine(
          (url) => url.startsWith("https://res.cloudinary.com/"),
          "Les images doivent provenir de Cloudinary"
        )
        .refine(
          (url) => url.length <= 500,
          "L'URL de l'image est trop longue"
        )
    )
    .min(5, "Au moins 5 images sont requises")
    .max(20, "Maximum 20 images autorisées")
    .refine(
      (images) => {
        // Vérifier qu'il n'y a pas de doublons
        const unique = new Set(images);
        return unique.size === images.length;
      },
      "Les images ne doivent pas contenir de doublons"
    ),
  description: z
    .string()
    .trim()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .transform((val) => val || undefined),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

