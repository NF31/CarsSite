// Types pour TransmissionType utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum TransmissionType dans prisma/schema.prisma

export const TransmissionType = {
  MANUAL: "MANUAL",
  AUTOMATIC: "AUTOMATIC",
} as const;

export type TransmissionType = (typeof TransmissionType)[keyof typeof TransmissionType];

