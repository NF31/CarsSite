// Types pour VehicleStatus utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum VehicleStatus dans prisma/schema.prisma

export const VehicleStatus = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  MAINTENANCE: "MAINTENANCE",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

