// Types pour PaymentStatus utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum PaymentStatus dans prisma/schema.prisma

export const PaymentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

