"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Edit,
  Mail,
  MoreVertical,
  Phone,
  Trash2,
  User,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { ClientListItem } from "@/actions/admin/clients";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_LABELS,
  clientDateFormatter,
  clientDateTimeFormatter,
} from "./client-helpers";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
} from "@/components/admin/bookings/booking-helpers";

interface ClientsListViewProps {
  clients: ClientListItem[];
  startIndex: number;
}

export function ClientsListView({ clients, startIndex }: ClientsListViewProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 px-4 py-12 text-center">
        <p className="text-lg font-semibold text-gray-900">Aucun client trouvé</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajustez votre recherche ou importez de nouveaux contacts pour les afficher ici.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Mode cartes pour mobile/tablette */}
      <div className="grid gap-4 xl:hidden">
        {clients.map((client, index) => {
          const lastBooking = client.lastBooking;

          return (
            <div
              key={client.id}
              className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900">{client.name}</p>
                  <p className="break-words font-mono text-xs text-muted-foreground">
                    {client.email}
                  </p>
                  {client.phone && (
                    <p className="break-words text-xs text-muted-foreground">{client.phone}</p>
                  )}
                </div>
                <Badge className={`${CLIENT_STATUS_COLORS[client.status]} text-[10px]`}>
                  {CLIENT_STATUS_LABELS[client.status]}
                </Badge>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>
                  Inscrit le{" "}
                  <span className="break-words font-medium text-gray-900">
                    {clientDateFormatter.format(new Date(client.createdAt))}
                  </span>
                </p>
                <p className="font-medium text-gray-900">
                  {client.bookingsCount} réservation{client.bookingsCount > 1 ? "s" : ""}
                </p>
                {client.hasDriverLicense && (
                  <Badge variant="outline" className="w-fit text-[10px]">
                    Permis validé
                  </Badge>
                )}
              </div>

              <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                {lastBooking ? (
                  <div className="space-y-1">
                    <p className="break-words font-semibold text-gray-900">
                      Dernière location :{" "}
                      {clientDateTimeFormatter.format(new Date(lastBooking.startDate))}
                    </p>
                    {lastBooking.vehicle && (
                      <p className="break-words">
                        {lastBooking.vehicle.brand} {lastBooking.vehicle.model} •{" "}
                        {lastBooking.vehicle.licensePlate}
                      </p>
                    )}
                    <Badge
                      className={`${BOOKING_STATUS_COLORS[lastBooking.status]} w-fit text-[10px]`}
                    >
                      {BOOKING_STATUS_LABELS[lastBooking.status]}
                    </Badge>
                  </div>
                ) : (
                  <span>Aucune réservation enregistrée</span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">#{startIndex + index + 1}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <MoreVertical className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/clients/${client.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        Voir la fiche client
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/bookings/add?clientId=${client.id}`}>
                        <UserRoundPlus className="mr-2 h-4 w-4" />
                        Créer une réservation
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()} disabled>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer un email (bientôt)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/clients/edit/${client.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => event.preventDefault()}
                      className="text-red-600 focus:text-red-600"
                      disabled
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer (bientôt)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()} disabled>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      Gérer le statut (bientôt)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tableau desktop */}
      <div className="hidden xl:block">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="overflow-hidden">
            <table className="w-full table-auto text-sm text-slate-700">
              <thead className="border-b bg-gradient-to-r from-slate-50 to-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Inscription
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Réservations
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Dernière location
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Statut</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client, index) => {
                  const lastBooking = client.lastBooking;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 align-top text-xs font-medium text-muted-foreground">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-900">{client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ID: <span className="font-mono text-[11px]">{client.id}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="flex min-w-0 items-center gap-2 text-gray-900">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="break-words">{client.email}</span>
                          </span>
                          {client.phone && (
                            <span className="flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="break-words">{client.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-muted-foreground whitespace-nowrap">
                        {clientDateFormatter.format(new Date(client.createdAt))}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {client.bookingsCount}
                          </span>
                          {client.hasDriverLicense && (
                            <Badge variant="outline" className="w-fit text-[10px]">
                              Permis validé
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                        {lastBooking ? (
                          <div className="flex flex-col gap-1 break-words">
                            <span className="text-sm font-medium text-slate-900">
                              {clientDateTimeFormatter.format(new Date(lastBooking.startDate))}
                            </span>
                            {lastBooking.vehicle && (
                              <span className="text-xs text-muted-foreground">
                                {lastBooking.vehicle.brand} {lastBooking.vehicle.model} •{" "}
                                {lastBooking.vehicle.licensePlate}
                              </span>
                            )}
                            <div>
                              <Badge
                                className={`${BOOKING_STATUS_COLORS[lastBooking.status]} w-fit text-[10px]`}
                              >
                                {BOOKING_STATUS_LABELS[lastBooking.status]}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            Aucune réservation
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge className={`${CLIENT_STATUS_COLORS[client.status]} text-[10px]`}>
                          {CLIENT_STATUS_LABELS[client.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <MoreVertical className="h-4 w-4" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/clients/${client.id}`}>
                                <User className="mr-2 h-4 w-4" />
                                Voir la fiche client
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/bookings/add?clientId=${client.id}`}>
                                <UserRoundPlus className="mr-2 h-4 w-4" />
                                Créer une réservation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()} disabled>
                              <Mail className="mr-2 h-4 w-4" />
                              Envoyer un email (bientôt)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/clients/edit/${client.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}
                              className="text-red-600 focus:text-red-600"
                              disabled
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer (bientôt)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()} disabled>
                              <BadgeCheck className="mr-2 h-4 w-4" />
                              Gérer le statut (bientôt)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


