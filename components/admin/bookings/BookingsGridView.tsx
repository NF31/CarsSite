"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  CalendarRange,
  MapPin,
  User,
  Car,
  Euro,
  ClipboardList,
  Check,
  Eye,
  Edit,
  XCircle,
  Archive,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  bookingCurrencyFormatter,
} from "./booking-helpers";

interface BookingListItem {
  id: string;
  reference: string;
  status: keyof typeof BOOKING_STATUS_LABELS;
  startDate: string;
  endDate: string;
  period: string;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  servicesCount: number;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    hasDriverLicense: boolean;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    category: string;
  };
  pickupLocation: {
    id: string;
    name: string;
    city: string;
  };
  returnLocation: {
    id: string;
    name: string;
    city: string;
  };
}

interface BookingsGridViewProps {
  bookings: BookingListItem[];
  startIndex?: number;
}

export function BookingsGridView({ bookings, startIndex = 0 }: BookingsGridViewProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-gray-900">Aucune réservation trouvée</p>
        <p className="text-sm text-muted-foreground mt-1">Ajustez vos filtres pour explorer d&apos;autres résultats.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {bookings.map((booking, index) => {
        const hasDriverLicense = booking.user.hasDriverLicense;
        const now = new Date();
        const startDateObj = new Date(booking.startDate);
        const endDateObj = new Date(booking.endDate);
        const canEdit = startDateObj > now && endDateObj > now;

        return (
          <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Référence</p>
                  <p className="text-lg font-semibold tracking-wide text-gray-900">{booking.reference}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs font-semibold shadow-sm border border-gray-300">
                    {startIndex + index + 1}
                  </span>
                <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-[11px] px-2 py-0.5`}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                  </Badge>
                  {!canEdit && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200"
                    >
                      Modification indisponible
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-md bg-gray-50 border px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CalendarRange className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.period}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">{booking.user.name}</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {booking.user.email && <span>{booking.user.email}</span>}
                      {booking.user.phone && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>{booking.user.phone}</span>
                        </>
                      )}
                      <span className="text-gray-300">|</span>
                      <span className={hasDriverLicense ? "text-emerald-600" : "text-amber-600"}>
                        {hasDriverLicense ? "Permis vérifié" : "Permis manquant"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Car className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.vehicle.licensePlate} • {booking.vehicle.category}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Retrait</p>
                      <p className="text-xs text-muted-foreground">{booking.pickupLocation.name}</p>
                      <p className="text-xs text-muted-foreground">{booking.pickupLocation.city}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Retour</p>
                      <p className="text-xs text-muted-foreground">{booking.returnLocation.name}</p>
                      <p className="text-xs text-muted-foreground">{booking.returnLocation.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-white px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium text-gray-600">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    Total
                  </div>
                  <div className="text-base font-semibold text-primary">
                    {bookingCurrencyFormatter.format(booking.totalPrice)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Acompte:{" "}
                    <span className="font-medium text-gray-700">
                      {bookingCurrencyFormatter.format(booking.depositPaid)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    Solde:{" "}
                    <span
                      className={`font-medium ${
                        booking.remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {bookingCurrencyFormatter.format(booking.remainingAmount)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>
                    {booking.servicesCount > 0
                      ? `${booking.servicesCount} service${booking.servicesCount > 1 ? "s" : ""} inclus`
                      : "Aucun service additionnel"}
                  </span>
                  {booking.notes && <span className="italic truncate max-w-[45%]">Note: {booking.notes}</span>}
                </div>
              </div>

            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <MoreVertical className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/bookings/${booking.id}`} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canEdit}
                    onSelect={(event) => {
                      if (!canEdit) {
                        event.preventDefault();
                      }
                    }}
                    className={!canEdit ? "cursor-not-allowed text-muted-foreground" : undefined}
                  >
                    {canEdit ? (
                      <Link href={`/admin/bookings/edit/${booking.id}`} className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Link>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier indisponible
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    className="text-amber-600"
                    disabled
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler (bientôt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    className="text-slate-600"
                    disabled
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archiver (bientôt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    className="text-red-600"
                    disabled
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer (bientôt)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


