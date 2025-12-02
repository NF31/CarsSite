import { CalendarRange } from "lucide-react";
import Link from "next/link";
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
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "../../booking-helpers";
import { Eye, Edit, MoreVertical, XCircle, Archive, Trash2 } from "lucide-react";
import type { FormattedBookingRow } from "../types";
import { BookingPricingInfo } from "./BookingPricingInfo";
import { BookingUserInfo } from "./BookingUserInfo";
import { BookingVehicleInfo } from "./BookingVehicleInfo";

interface BookingTableProps {
  rows: FormattedBookingRow[];
}

export function BookingTable({ rows }: BookingTableProps) {
  return (
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
          {rows.map(({ booking, index, canEdit }) => (
            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{index}</td>
              <td className="px-4 py-3 align-top">
                <div className="font-semibold text-gray-900">{booking.reference}</div>
                <div className="text-xs text-muted-foreground">Services : {booking.servicesCount}</div>
              </td>
              <td className="px-4 py-3 align-top">
                <BookingUserInfo user={booking.user} variant="desktop" />
              </td>
              <td className="px-4 py-3 align-top">
                <BookingVehicleInfo vehicle={booking.vehicle} variant="desktop" />
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex items-start gap-2 text-xs text-muted-foreground break-words">
                  <CalendarRange className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium leading-relaxed">{booking.period}</span>
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                <BookingPricingInfo booking={booking} variant="desktop" />
              </td>
              <td className="px-4 py-3 align-top whitespace-nowrap">
                <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-[11px] px-2 py-0.5`}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
                {!canEdit && (
                  <div className="mt-1 text-[11px] text-amber-700 font-medium">
                    Modification indisponible
                  </div>
                )}
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
  );
}

