// Types pour MaintenanceType utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum MaintenanceType dans prisma/schema.prisma

export const MaintenanceType = {
  SERVICE: "SERVICE",
  REPAIR: "REPAIR",
  INSPECTION: "INSPECTION",
  BLOCKED: "BLOCKED",
} as const;

export type MaintenanceType = (typeof MaintenanceType)[keyof typeof MaintenanceType];

