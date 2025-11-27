"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Lock, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS, clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import type { ClientDetail } from "@/actions/admin/clients";
import type { LucideIcon } from "lucide-react";

interface ClientEditFormHeaderProps {
  client: ClientDetail;
  StatusIcon: LucideIcon;
  canCreateReservation: boolean;
  accountAge: string;
  lastUpdate: string;
}

export const ClientEditFormHeader = memo(function ClientEditFormHeader({
  client,
  StatusIcon,
  canCreateReservation,
  accountAge,
  lastUpdate,
}: ClientEditFormHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 break-words">Modifier le client</h1>
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
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>ID client&nbsp;: <span className="font-mono">{client.id}</span></span>
            <span className="text-gray-300">•</span>
            <span>Compte créé il y a {accountAge}</span>
            <span className="text-gray-300">•</span>
            <span>Dernière mise à jour {lastUpdate}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {canCreateReservation && (
          <Link href={`/admin/bookings/add?clientId=${client.id}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <UserRoundPlus className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Button>
          </Link>
        )}
        <Link href={`/admin/clients/${client.id}`}>
          <Button className="w-full sm:w-auto">Voir la fiche</Button>
        </Link>
      </div>
    </div>
  );
});

