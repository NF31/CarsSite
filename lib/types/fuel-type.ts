// Types pour FuelType utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum FuelType dans prisma/schema.prisma

export const FuelType = {
  PETROL: "PETROL",
  DIESEL: "DIESEL",
  ELECTRIC: "ELECTRIC",
  HYBRID: "HYBRID",
} as const;

export type FuelType = (typeof FuelType)[keyof typeof FuelType];

