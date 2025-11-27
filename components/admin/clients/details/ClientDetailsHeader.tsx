"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Edit,
  UserRoundPlus,
  CalendarRange,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS, clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";
import type { LucideIcon } from "lucide-react";

interface ClientDetailsHeaderProps {
  client: ClientDetail;
  StatusIcon: LucideIcon;
  canCreateReservation: boolean;
}

export const ClientDetailsHeader = memo(function ClientDetailsHeader({
  client,
  StatusIcon,
  canCreateReservation,
}: ClientDetailsHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex items-start gap-3 xl:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 break-words">{client.name}</h1>
            <Badge className={`${CLIENT_STATUS_COLORS[client.status]} flex items-center gap-1`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {CLIENT_STATUS_LABELS[client.status]}
            </Badge>
            {client.lockedUntil && new Date(client.lockedUntil) > new Date() ? (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Lock className="h-3.5 w-3.5" />
                Verrouillé jusqu&apos;au{" "}
                {clientDateTimeFormatter.format(new Date(client.lockedUntil))}
              </Badge>
            ) : null}
            {client.deletedAt && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs text-amber-700 border-amber-200 bg-amber-50">
                <AlertCircle className="h-3.5 w-3.5" />
                Compte désactivé
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
            <span>Compte créé le {clientDateTimeFormatter.format(new Date(client.createdAt))}</span>
            <span className="text-gray-300">•</span>
            <span>Dernière mise à jour {clientDateTimeFormatter.format(new Date(client.updatedAt))}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full xl:w-auto">
        <Link href={`/admin/clients/edit/${client.id}`} className="w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </Link>
        {canCreateReservation ? (
          <Link href={`/admin/bookings/add?clientId=${client.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full sm:w-auto opacity-60"
            variant="outline"
            disabled
            title="Client inactif : réactivez le compte avant de créer une réservation."
          >
            <UserRoundPlus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Button>
        )}
        <Link href={`/admin/bookings?search=${encodeURIComponent(client.name)}`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <CalendarRange className="mr-2 h-4 w-4" />
            Historique des réservations
          </Button>
        </Link>
        <Button variant="outline" className="w-full sm:w-auto" disabled>
          <Mail className="mr-2 h-4 w-4" />
          Envoyer un email (bientôt)
        </Button>
      </div>
    </div>
  );
});

