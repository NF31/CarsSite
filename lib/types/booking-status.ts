// Types pour BookingStatus utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum BookingStatus dans prisma/schema.prisma

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

