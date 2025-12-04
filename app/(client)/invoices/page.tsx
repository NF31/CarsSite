import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";
import { ClientInvoicesPageClient } from "@/components/client/invoices/ClientInvoicesPageClient";
import { InvoiceStatus } from "@/lib/types/invoice-status";

export const dynamic = "force-dynamic";

export default async function ClientInvoicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Récupérer toutes les factures de l'utilisateur
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      booking: {
        select: {
          id: true,
          reference: true,
          startDate: true,
          endDate: true,
          vehicle: {
            select: {
              brand: true,
              model: true,
              licensePlate: true,
            },
          },
        },
      },
    },
    orderBy: {
      issuedAt: "desc",
    },
  });

  // Calculer les statistiques
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const outstandingAmount = invoices
    .filter((inv) => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE)
    .reduce((sum, inv) => sum + inv.total, 0);
  const paidCount = invoices.filter((inv) => inv.status === InvoiceStatus.PAID).length;
  const pendingCount = invoices.filter(
    (inv) => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.OVERDUE
  ).length;

  const invoicesList = invoices.map((invoice) => ({
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
    booking: {
      id: invoice.booking.id,
      reference: invoice.booking.reference,
      startDate: invoice.booking.startDate.toISOString(),
      endDate: invoice.booking.endDate.toISOString(),
      vehicle: {
        brand: invoice.booking.vehicle.brand,
        model: invoice.booking.vehicle.model,
        licensePlate: invoice.booking.vehicle.licensePlate,
      },
    },
  }));

  const summary = {
    totalInvoices,
    totalAmount,
    outstandingAmount,
    paidCount,
    pendingCount,
  };

  return (
    <div className="container space-y-8 py-8 px-4 sm:px-6">
      <ClientBreadcrumbs
        items={[
          { label: "Tableau de bord", href: "/dashboard" },
          { label: "Mes factures", href: "/invoices" },
        ]}
        className="mb-4"
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Mes factures</h1>
        <p className="text-gray-600">
          Consultez et téléchargez toutes vos factures de location.
        </p>
      </header>

      <ClientInvoicesPageClient invoices={invoicesList} summary={summary} />
    </div>
  );
}

