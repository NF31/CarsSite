"use server";

import { prisma } from "@/lib/prisma";
import { InvoiceStatus, Prisma } from "@prisma/client";

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
  user: {
    id: string;
    name: string;
    email: string | null;
  };
  booking: {
    id: string;
    reference: string;
    startDate: string;
  };
}

export interface InvoiceClientItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bookings: Array<{
    id: string;
    reference: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    vehicle: {
      brand: string;
      model: string;
    };
    invoice: {
      id: string;
      invoiceNumber: string;
      status: InvoiceStatus;
      total: number;
    } | null;
  }>;
}

export interface InvoicesSummary {
  totalInvoices: number;
  totalAmount: number;
  outstandingAmount: number;
  paidCount: number;
  sentCount: number;
  overdueCount: number;
  draftCount: number;
}

export interface GetInvoicesResult {
  success: boolean;
  data?: {
    invoices: InvoiceListItem[];
    summary: InvoicesSummary;
    clients: InvoiceClientItem[];
  };
  error?: string;
}

export async function getInvoicesAction(): Promise<GetInvoicesResult> {
  try {
    const [invoices, clients] = await Promise.all([
      prisma.invoice.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking: {
            select: {
              id: true,
              reference: true,
              startDate: true,
            },
          },
        },
        orderBy: {
          issuedAt: "desc",
        },
      }),
      prisma.user.findMany({
        where: {
          role: "CLIENT",
          bookings: {
            some: {},
          },
        },
        include: {
          bookings: {
            where: {
              status: {
                not: "CANCELLED",
              },
            },
            include: {
              vehicle: {
                select: {
                  brand: true,
                  model: true,
                },
              },
              invoice: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  status: true,
                  total: true,
                },
              },
            },
            orderBy: {
              startDate: "desc",
            },
          },
        },
      }),
    ]);

    const invoicesList: InvoiceListItem[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      issuedAt: invoice.issuedAt.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString() || null,
      pdfUrl: invoice.pdfUrl,
      user: {
        id: invoice.user.id,
        name: invoice.user.name,
        email: invoice.user.email,
      },
      booking: {
        id: invoice.booking.id,
        reference: invoice.booking.reference,
        startDate: invoice.booking.startDate.toISOString(),
      },
    }));

    const summary: InvoicesSummary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
      outstandingAmount: invoices
        .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
        .reduce((sum, inv) => sum + inv.total, 0),
      paidCount: invoices.filter((inv) => inv.status === "PAID").length,
      sentCount: invoices.filter((inv) => inv.status === "SENT").length,
      overdueCount: invoices.filter((inv) => inv.status === "OVERDUE").length,
      draftCount: invoices.filter((inv) => inv.status === "DRAFT").length,
    };

    const clientsList: InvoiceClientItem[] = clients
      .filter((client) => client.bookings.length > 0)
      .map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email || "",
        phone: client.phone,
        bookings: client.bookings.map((booking) => ({
          id: booking.id,
          reference: booking.reference,
          startDate: booking.startDate.toISOString(),
          endDate: booking.endDate.toISOString(),
          totalPrice: booking.totalPrice,
          vehicle: {
            brand: booking.vehicle.brand,
            model: booking.vehicle.model,
          },
          invoice: booking.invoice
            ? {
                id: booking.invoice.id,
                invoiceNumber: booking.invoice.invoiceNumber,
                status: booking.invoice.status,
                total: booking.invoice.total,
              }
            : null,
        })),
      }));

    return {
      success: true,
      data: {
        invoices: invoicesList,
        summary,
        clients: clientsList,
      },
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des factures",
    };
  }
}

