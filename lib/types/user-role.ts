// Types pour UserRole utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum UserRole dans prisma/schema.prisma

export const UserRole = {
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

