import { z } from "zod";
import { BookingStatus } from "@prisma/client";

const dateTimeString = z
  .string()
  .min(1, "Date requise")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Date invalide",
  })
  .transform((value) => new Date(value));

const baseBookingSchema = z.object({
  userId: z.string().min(1, "Sélectionnez un client"),
  vehicleId: z.string().min(1, "Sélectionnez un véhicule"),
  pickupLocationId: z.string().min(1, "Sélectionnez une agence de départ"),
  returnLocationId: z.string().min(1, "Sélectionnez une agence de retour"),
  startDate: dateTimeString,
  endDate: dateTimeString,
  status: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
  serviceIds: z.array(z.string()).optional().default([]),
  totalPrice: z.number().min(0, "Le montant total doit être supérieur ou égal à 0"),
  depositPaid: z.number().min(0, "L'acompte doit être supérieur ou égal à 0"),
  notes: z
    .string()
    .max(1000, "1 000 caractères maximum")
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  sendConfirmation: z.boolean().optional().default(false),
});

type BaseBookingData = z.infer<typeof baseBookingSchema>;

function validateBookingData(data: BaseBookingData, ctx: z.RefinementCtx) {
  const now = new Date();
  if (data.startDate < now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startDate"],
      message: "La date de début doit être dans le futur",
    });
  }

  if (data.endDate < now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "La date de fin doit être dans le futur",
    });
  }

  if (data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "La date de fin doit être postérieure à la date de début",
    });
  }

  if (data.depositPaid > data.totalPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["depositPaid"],
      message: "L'acompte ne peut pas dépasser le montant total",
    });
  }
}

export const createBookingSchema = baseBookingSchema.superRefine(validateBookingData);

export const updateBookingSchema = baseBookingSchema
  .extend({
    bookingId: z.string().min(1, "Identifiant de réservation invalide"),
  })
  .superRefine((data, ctx) => {
    validateBookingData(data, ctx);
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateBookingPayload = z.input<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdateBookingPayload = z.input<typeof updateBookingSchema>;

