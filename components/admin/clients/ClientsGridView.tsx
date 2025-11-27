"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Edit,
  IdCard,
  ListChecks,
  Mail,
  MoreVertical,
  Phone,
  Trash2,
  User,
  UserRoundPlus,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import type { ClientListItem } from "@/actions/admin/clients";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_ICONS,
  CLIENT_STATUS_LABELS,
  clientDateFormatter,
  clientDateTimeFormatter,
} from "./client-helpers";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/components/admin/bookings/booking-helpers";
import { getDriverLicenseUrlAction } from "@/actions/admin/bookings";

interface ClientsGridViewProps {
  clients: ClientListItem[];
  startIndex: number;
}

export function ClientsGridView({ clients, startIndex }: ClientsGridViewProps) {
  const [isPending, startTransition] = useTransition();
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const handleViewDriverLicense = (clientId: string) => {
    startTransition(async () => {
      setLicenseError(null);
      const result = await getDriverLicenseUrlAction({
        userId: clientId,
      });

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis pour ce client.");
        return;
      }

      // Télécharger le PDF avec le nom du fichier original
      // Utiliser fetch + blob pour forcer le bon nom de fichier
      try {
        const response = await fetch(result.data.url);
        if (!response.ok) throw new Error("Erreur lors du téléchargement");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.fileName || "permis.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch {
        // Fallback : ouvrir dans un nouvel onglet
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    });
  };

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ListChecks className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-gray-900">Aucun client trouvé</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Ajustez vos filtres ou importez de nouveaux clients pour les visualiser ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {clients.map((client, index) => {
        const statusLabel = CLIENT_STATUS_LABELS[client.status];
        const statusColor = CLIENT_STATUS_COLORS[client.status];
        const StatusIcon = CLIENT_STATUS_ICONS[client.status];
        const lastBooking = client.lastBooking;
        const hasLastBooking = Boolean(lastBooking);

        const canCreateReservation = client.status === "ACTIVE";

        return (
          <Card
            key={client.id}
            className="relative overflow-hidden border border-slate-100 shadow-sm transition-shadow hover:shadow-lg"
          >
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                      {client.hasDriverLicense && (
                        <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                          <IdCard className="h-3 w-3" />
                          Permis vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {client.email}
                      </span>
                      {client.phone && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inscrit le {clientDateFormatter.format(new Date(client.createdAt))}
                    </p>
                  </div>
                </div>
                <Badge className={`flex items-center gap-1 ${statusColor}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusLabel}
                </Badge>
              </div>

              <div className="rounded-md border border-dashed border-slate-200 bg-white/70 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Réservations
                  </span>
                  <span className="text-base font-semibold text-gray-900">
                    {client.bookingsCount}
                  </span>
                </div>
                {hasLastBooking ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase text-muted-foreground">Dernière location</span>
                        <span className="font-medium text-gray-900">
                          {clientDateTimeFormatter.format(new Date(lastBooking!.startDate))}
                        </span>
                        {lastBooking?.vehicle && (
                          <span className="text-xs text-muted-foreground">
                            {lastBooking.vehicle.brand} {lastBooking.vehicle.model} •{" "}
                            {lastBooking.vehicle.licensePlate}
                          </span>
                        )}
                      </div>
                      <Badge className={`${BOOKING_STATUS_COLORS[lastBooking.status]} text-[10px]`}>
                        {BOOKING_STATUS_LABELS[lastBooking.status]}
                      </Badge>
                    </div>
                    {lastBooking?.endDate && (
                      <p className="text-xs text-muted-foreground">
                        Retour le {clientDateTimeFormatter.format(new Date(lastBooking.endDate))}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-muted-foreground">
                    Ce client n&apos;a pas encore effectué de réservation.
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  #{startIndex + index + 1}
                </span>
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
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()} disabled>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer un email (bientôt)
                    </DropdownMenuItem>
                    {client.hasDriverLicense && (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          handleViewDriverLicense(client.id);
                        }}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Shield className="mr-2 h-4 w-4" />
                        )}
                        Voir le permis
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {canCreateReservation ? (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/bookings/add?clientId=${client.id}`}>
                          <UserRoundPlus className="mr-2 h-4 w-4" />
                          Créer une réservation
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem disabled className="opacity-60">
                        <UserRoundPlus className="mr-2 h-4 w-4" />
                        Réservation indisponible (client inactif)
                      </DropdownMenuItem>
                    )}
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


