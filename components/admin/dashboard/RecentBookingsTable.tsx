import { memo } from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { deriveBookingStatus } from "@/lib/booking-status-sync";
import type { DashboardData } from "@/actions/admin/dashboard";

const STATUS_META: Record<BookingStatus, { label: string; badgeClass: string }> = {
  [BookingStatus.PENDING]: {
    label: "En attente",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  [BookingStatus.CONFIRMED]: {
    label: "Confirmée",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  [BookingStatus.IN_PROGRESS]: {
    label: "En cours",
    badgeClass: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  [BookingStatus.COMPLETED]: {
    label: "Terminée",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  [BookingStatus.CANCELLED]: {
    label: "Annulée",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
  },
};

function computeDynamicStatus(booking: {
  status: BookingStatus;
  startDate: Date;
  endDate: Date;
  modificationRequested?: boolean | null;
  modificationDepositDifference?: number | null;
  cancellationRequested?: boolean | null;
}) {
  return deriveBookingStatus({
    status: booking.status,
    startDate: booking.startDate,
    endDate: booking.endDate,
    modificationRequested: booking.modificationRequested ?? false,
    modificationDepositDifference: booking.modificationDepositDifference ?? null,
    cancellationRequested: booking.cancellationRequested ?? false,
  });
}

interface RecentBookingsTableProps {
  bookings: DashboardData["recentBookings"];
}

export const RecentBookingsTable = memo(function RecentBookingsTable({
  bookings,
}: RecentBookingsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Réservations Récentes</CardTitle>
          <CardDescription>Dernières réservations à traiter</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/bookings">Voir toutes</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Référence
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Véhicule
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Dates</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Prix</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const status = computeDynamicStatus(booking);
                  const meta = STATUS_META[status];
                  return (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">#{booking.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{booking.user.name}</div>
                          <div className="text-sm text-gray-500">{booking.user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {booking.vehicle.brand} {booking.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.vehicle.licensePlate}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{new Date(booking.startDate).toLocaleDateString("fr-FR")}</div>
                          <div className="text-gray-500">
                            {new Date(booking.endDate).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(Number(booking.totalPrice))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn("font-medium", meta.badgeClass)}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/bookings/${booking.id}`}>Voir</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune réservation récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

