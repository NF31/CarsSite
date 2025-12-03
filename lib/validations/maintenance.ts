import { z } from "zod";

const maintenanceTypes = ["SERVICE", "REPAIR", "INSPECTION", "BLOCKED"] as const;
const maintenanceStatuses = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export const createMaintenanceSchema = z
  .object({
    vehicleId: z
      .string()
      .trim()
      .min(1, "Le véhicule est requis"),
    type: z.enum(maintenanceTypes, {
      message: "Type de maintenance invalide",
    }),
    startDate: z.coerce
      .date()
      .refine((date) => !Number.isNaN(date.getTime()), "La date de début est invalide"),
    endDate: z.coerce
      .date()
      .refine((date) => !Number.isNaN(date.getTime()), "La date de fin est invalide"),
    description: z
      .string()
      .trim()
      .max(1000, "La description ne peut pas dépasser 1000 caractères")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    cost: z.coerce
      .number()
      .refine((value) => Number.isFinite(value), "Le coût doit être un nombre valide")
      .min(0, "Le coût ne peut pas être négatif")
      .max(1000000, "Le coût ne peut pas dépasser 1 000 000€"),
    notes: z
      .string()
      .trim()
      .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
  })
  .refine(
    (data) => data.endDate > data.startDate,
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endDate"],
    }
  );

export const updateMaintenanceSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, "L'identifiant de maintenance est requis"),
    type: z
      .enum(maintenanceTypes, {
        message: "Type de maintenance invalide",
      })
      .optional(),
    status: z
      .enum(maintenanceStatuses, {
        message: "Statut de maintenance invalide",
      })
      .optional(),
    startDate: z.coerce
      .date()
      .refine((date) => Number.isFinite(date.getTime()), "La date de début est invalide")
      .optional(),
    endDate: z.coerce
      .date()
      .refine((date) => Number.isFinite(date.getTime()), "La date de fin est invalide")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "La description ne peut pas dépasser 1000 caractères")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    cost: z.coerce
      .number()
      .refine((value) => Number.isFinite(value), "Le coût doit être un nombre valide")
      .min(0, "Le coût ne peut pas être négatif")
      .max(1000000, "Le coût ne peut pas dépasser 1 000 000€")
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endDate"],
    }
  );

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type MaintenanceTypeInput = (typeof maintenanceTypes)[number];
export type MaintenanceStatusInput = (typeof maintenanceStatuses)[number];

