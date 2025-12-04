// Types pour SettingCategory utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum SettingCategory dans prisma/schema.prisma

export const SettingCategory = {
  GENERAL: "GENERAL",
  PAYMENT: "PAYMENT",
  EMAIL: "EMAIL",
  BOOKING: "BOOKING",
  OTHER: "OTHER",
} as const;

export type SettingCategory = (typeof SettingCategory)[keyof typeof SettingCategory];

