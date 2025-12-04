// Types pour MaintenanceStatus utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum MaintenanceStatus dans prisma/schema.prisma

export const MaintenanceStatus = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

