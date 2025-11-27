"use client";

import { memo } from "react";
import Link from "next/link";
import { useFormContext } from "react-hook-form";
import { User, ShieldCheck, FileWarning, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BookingFormValues } from "../BookingForm";
import type { BookingUserOption } from "@/actions/admin/bookings";

interface DriverLicenseUploadInfo {
  normalizedCount: number;
  remaining: number;
  nextAllowedAt: Date | null;
  lastWithinWindow: Date | null;
}

interface ClientInformationCardProps {
  userOptions: BookingUserOption[];
  selectedUser: BookingUserOption | null;
  driverLicenseUploadInfo: DriverLicenseUploadInfo | null;
  isPending: boolean;
  isDriverLicenseUploadBlocked: boolean;
  maxReplacements: number;
  dateFormatter: Intl.DateTimeFormat;
  onOpenLicenseDialog: () => void;
  onOpenClientDialog: () => void;
}

export const ClientInformationCard = memo(function ClientInformationCard({
  userOptions,
  selectedUser,
  driverLicenseUploadInfo,
  isPending,
  isDriverLicenseUploadBlocked,
  maxReplacements,
  dateFormatter,
  onOpenLicenseDialog,
  onOpenClientDialog,
}: ClientInformationCardProps) {
  const form = useFormContext<BookingFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations client</CardTitle>
        <CardDescription>
          Choisissez le client concerné par la réservation. Les clients supprimés ne sont pas affichés.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full min-h-[48px]">
                  <SelectValue placeholder="Sélectionnez un client">
                    {selectedUser ? (
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-gray-900">
                          {selectedUser.name}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {selectedUser.email} • {selectedUser.totalBookings} réservation(s)
                        </span>
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email} • {user.totalBookings} réservation(s)
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            user.hasDriverLicense ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {user.hasDriverLicense ? "Permis enregistré" : "Permis manquant"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {selectedUser && (
          <div
            className={cn(
              "lg:col-span-2 flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between",
              selectedUser.hasDriverLicense
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            )}
          >
            <div className="flex items-start gap-2">
              {selectedUser.hasDriverLicense ? (
                <ShieldCheck className="mt-0.5 h-4 w-4" />
              ) : (
                <FileWarning className="mt-0.5 h-4 w-4" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {selectedUser.hasDriverLicense
                    ? "Permis de conduire déjà enregistré."
                    : "Permis de conduire manquant."}
                </p>
                <p className="text-xs opacity-80">
                  {selectedUser.hasDriverLicense
                    ? "Vous pouvez remplacer le document si nécessaire."
                    : "Importez un PDF sécurisé avant de créer la réservation."}
                </p>
                {driverLicenseUploadInfo && (
                  <p className="text-xs opacity-80">
                    Remplacements restants :{" "}
                    <span className="font-medium text-gray-900">{driverLicenseUploadInfo.remaining}</span>{" "}
                    / {maxReplacements}
                    {driverLicenseUploadInfo.nextAllowedAt && (
                      <>
                        {" "}
                        • Prochain remplacement possible le{" "}
                        <span className="font-medium text-gray-900">
                          {dateFormatter.format(driverLicenseUploadInfo.nextAllowedAt)}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenLicenseDialog}
              className="self-stretch sm:self-auto lg:self-auto"
              disabled={isPending || isDriverLicenseUploadBlocked}
            >
              <UploadCloud className="mr-2 h-3.5 w-3.5" />
              {selectedUser.hasDriverLicense ? "Remplacer le permis" : "Ajouter le permis"}
            </Button>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <User className="mt-1 h-4 w-4 text-primary" />
          <p>
            Si le client n&apos;existe pas encore, créez-le depuis la section{" "}
            <Button variant="link" className="h-auto px-0" asChild>
              <Link href="/admin/clients">Clients</Link>
            </Button>
            .
          </p>
        </div>
        <div className="lg:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={onOpenClientDialog}
            className="w-full sm:w-auto"
          >
            Ajouter un nouveau client
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

