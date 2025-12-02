import { z } from "zod";

export const createPublicBookingSchema = z.object({
  vehicleId: z.string().min(1, "Véhicule requis"),
  startDate: z
    .string()
    .min(1, "Date de début requise")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  endDate: z
    .string()
    .min(1, "Date de fin requise")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Date invalide")
    .transform((value) => new Date(value)),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  pickup: z.string().min(1, "Lieu de retrait requis"),
  returnLocation: z.string().min(1, "Lieu de retour requis"),
  pickupPlaceId: z.string().optional(),
  returnPlaceId: z.string().optional(),
  serviceIds: z.array(z.string()).optional().default([]),
  customerName: z.string().min(1, "Nom requis"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(1, "Téléphone requis"),
  driverLicenseUrl: z.string().url("URL du permis invalide").optional(),
  acceptedTerms: z.boolean().refine((value) => value === true, "Vous devez accepter les CGV"),
});

export type CreatePublicBookingInput = z.infer<typeof createPublicBookingSchema>;

export interface CreatePublicBookingResult {
  success: boolean;
  data?: {
    bookingId: string;
    reference: string;
  };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

