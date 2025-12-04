// Types pour ServicePricingType utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum ServicePricingType dans prisma/schema.prisma

export const ServicePricingType = {
  PER_DAY: "PER_DAY",
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
} as const;

export type ServicePricingType = (typeof ServicePricingType)[keyof typeof ServicePricingType];

