// Types pour InvoiceStatus utilisables côté client sans importer Prisma Client
// Ces types correspondent à l'enum InvoiceStatus dans prisma/schema.prisma

export const InvoiceStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

