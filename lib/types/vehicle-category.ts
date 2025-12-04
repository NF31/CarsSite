// Types pour VehicleCategory utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum VehicleCategory dans prisma/schema.prisma

export const VehicleCategory = {
  ECONOMY: "ECONOMY",
  COMPACT: "COMPACT",
  MID_SIZE: "MID_SIZE",
  FULL_SIZE: "FULL_SIZE",
  SUV: "SUV",
  LUXURY: "LUXURY",
  VAN: "VAN",
} as const;

export type VehicleCategory = (typeof VehicleCategory)[keyof typeof VehicleCategory];

