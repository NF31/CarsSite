import { z } from "zod";
import { ServicePricingType } from "@/lib/types/service-pricing-type";
import { VehicleCategory } from "@prisma/client";

const nameSchema = z
  .string()
  .trim()
  .min(3, "Le nom doit contenir au moins 3 caractères")
  .max(80, "Le nom ne peut pas dépasser 80 caractères");

const descriptionSchema = z
  .string()
  .trim()
  .max(600, "La description ne peut pas dépasser 600 caractères")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const iconSchema = z
  .string()
  .trim()
  .max(60, "L'icône ne peut pas dépasser 60 caractères")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const pricingTypeSchema = z.nativeEnum(ServicePricingType);

const availableCategoriesSchema = z
  .array(
    z.nativeEnum(VehicleCategory)
  )
  .max(7, "Trop de catégories sélectionnées")
  .optional()
  .transform((value) => value ?? []);

export const createServiceSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    price: z.number().positive("Le prix doit être supérieur à 0"),
    pricingType: pricingTypeSchema,
    availableForCategories: availableCategoriesSchema,
    icon: iconSchema,
  })
  .superRefine((data, ctx) => {
    if (data.pricingType === "PERCENTAGE" && (data.price <= 0 || data.price > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Pourcentage valide entre 0 et 100",
      });
    }

    if (data.pricingType !== "PERCENTAGE" && data.price > 10000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Le prix semble trop élevé",
      });
    }
  });

export const updateServiceSchema = createServiceSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.price !== undefined && data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Le prix doit être supérieur à 0",
      });
    }
  });

export type CreateServiceInput = z.input<typeof createServiceSchema>;
export type UpdateServiceInput = z.input<typeof updateServiceSchema>;
export type CreateServiceData = z.output<typeof createServiceSchema>;

