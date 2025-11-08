"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  bookingCurrencyFormatter,
} from "./booking-helpers";
import {
  CalendarRange,
  MapPin,
  User,
  Car,
  ClipboardList,
  Euro,
  Check,
  MoreVertical,
  Eye,
  Edit,
  XCircle,
  Archive,
  Trash2,
} from "lucide-react";

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

interface BookingsListViewProps {
  bookings: BookingListItem[];
  startIndex?: number;
}

export function BookingsListView({ bookings, startIndex = 0 }: BookingsListViewProps) {
  const formattedRows = useMemo(
    () =>
      bookings.map((booking, index) => {
        return {
          booking,
          index: startIndex + index + 1,
        };
      }),
    [bookings, startIndex],
  );

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-gray-900">Aucune réservation trouvée</p>
        <p className="text-sm text-muted-foreground mt-1">Essayez d&apos;ajuster vos filtres.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 xl:hidden">
        {formattedRows.map(({ booking, index }) => (
          <div key={booking.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Réservation #{index}</p>
                <p className="text-lg font-semibold text-gray-900">{booking.reference}</p>
              </div>
              <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-[11px] px-2 py-0.5`}>
                {BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <span>{booking.period}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.user.name}</p>
                  <div className="text-xs text-muted-foreground space-x-2">
                    {booking.user.email && <span>{booking.user.email}</span>}
                    {booking.user.phone && <span>{booking.user.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Car className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-semibold">
                    {booking.vehicle.brand} {booking.vehicle.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.vehicle.licensePlate} • {booking.vehicle.category}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Retrait</p>
                  <p>{booking.pickupLocation.name}</p>
                  <p>{booking.pickupLocation.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Retour</p>
                  <p>{booking.returnLocation.name}</p>
                  <p>{booking.returnLocation.city}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-md px-3 py-2 text-sm bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  Total
                </span>
                <span className="font-semibold text-primary">
                  {bookingCurrencyFormatter.format(booking.totalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Acompte {bookingCurrencyFormatter.format(booking.depositPaid)}
                </span>
                <span>
                  Solde{" "}
                  <span
                    className={`font-medium ${
                      booking.remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    {bookingCurrencyFormatter.format(booking.remainingAmount)}
                  </span>
                </span>
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
                      Voir
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/bookings/edit/${booking.id}`} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-amber-600"
                    onSelect={(event) => event.preventDefault()}
                    disabled
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler (bientôt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-slate-600"
                    onSelect={(event) => event.preventDefault()}
                    disabled
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archiver (bientôt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={(event) => event.preventDefault()}
                    disabled
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer (bientôt)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden xl:block rounded-lg border bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Référence</th>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Véhicule</th>
              <th className="px-4 py-3 text-left">Période</th>
              <th className="px-4 py-3 text-left">Montant</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {formattedRows.map(({ booking, index }) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{index}</td>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-gray-900">{booking.reference}</div>
                  <div className="text-xs text-muted-foreground">Services : {booking.servicesCount}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-gray-900">{booking.user.name}</div>
                  <div className="text-xs text-muted-foreground flex flex-col gap-0.5 break-words">
                    {booking.user.email && <span>{booking.user.email}</span>}
                    {booking.user.phone && <span>{booking.user.phone}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-gray-900">
                    {booking.vehicle.brand} {booking.vehicle.model}
                  </div>
                  <div className="text-xs text-muted-foreground break-words">
                    {booking.vehicle.licensePlate} • {booking.vehicle.category}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground break-words">
                    <CalendarRange className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium leading-relaxed">{booking.period}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-primary">
                    {bookingCurrencyFormatter.format(booking.totalPrice)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Acompte {bookingCurrencyFormatter.format(booking.depositPaid)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      booking.remainingAmount > 0 ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    Solde {bookingCurrencyFormatter.format(booking.remainingAmount)}
                  </div>
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-[11px] px-2 py-0.5`}>
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right align-top whitespace-nowrap">
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
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/bookings/edit/${booking.id}`} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                    className="text-amber-600"
                        onSelect={(event) => event.preventDefault()}
                        disabled
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Annuler (bientôt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-slate-600"
                    onSelect={(event) => event.preventDefault()}
                    disabled
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archiver (bientôt)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={(event) => event.preventDefault()}
                    disabled
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer (bientôt)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


