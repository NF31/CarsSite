"use client";

import { memo } from "react";
import { Lock, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
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
import { Input } from "@/components/ui/input";
import { clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import type { UseFormReturn } from "react-hook-form";
import type { ClientDetail } from "@/actions/admin/clients";

interface FormValues {
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "locked";
  lockedUntil?: string;
}

interface ClientStatusCardProps {
  form: UseFormReturn<FormValues>;
  selectedStatus: "active" | "inactive" | "locked";
  lockedUntilValue: string;
  isCurrentlyLocked: boolean;
  client: ClientDetail;
  statusOptions: { value: "active" | "inactive" | "locked"; label: string }[];
}

export const ClientStatusCard = memo(function ClientStatusCard({
  form,
  selectedStatus,
  lockedUntilValue,
  isCurrentlyLocked,
  client,
  statusOptions,
}: ClientStatusCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Gestion du statut
        </CardTitle>
        <CardDescription>
          Contrôlez l&apos;accès du client à l&apos;espace de réservation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedStatus === "locked" && (
          <FormField
            control={form.control}
            name="lockedUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Déverrouiller le</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Le compte sera automatiquement réactivé après cette date.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedStatus === "inactive" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Le client ne pourra plus se connecter tant que le statut restera inactif.
          </div>
        )}

        {selectedStatus === "locked" && lockedUntilValue && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
            Déverrouillage planifié pour le{" "}
            {clientDateTimeFormatter.format(new Date(lockedUntilValue))}
          </div>
        )}

        {isCurrentlyLocked && selectedStatus !== "locked" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Le compte est actuellement verrouillé jusqu&apos;au{" "}
            {clientDateTimeFormatter.format(new Date(client.lockedUntil!))}. Changer de
            statut annule ce verrouillage.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

