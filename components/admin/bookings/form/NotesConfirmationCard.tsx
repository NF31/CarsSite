"use client";

import { memo } from "react";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
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
import { Textarea } from "@/components/ui/textarea";
import type { BookingFormValues } from "@/hooks/useBookingForm";

interface NotesConfirmationCardProps {
  isEditMode: boolean;
}

export const NotesConfirmationCard = memo(function NotesConfirmationCard({
  isEditMode,
}: NotesConfirmationCardProps) {
  const form = useFormContext<BookingFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes & confirmation</CardTitle>
        <CardDescription>
          Ajoutez des notes internes et choisissez si un email doit être envoyé au client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes internes</FormLabel>
              <Textarea
                placeholder="Précisions sur les conditions, demande spécifique du client…"
                rows={4}
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sendConfirmation"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <FormLabel>
                  {isEditMode ? "Envoyer un email de mise à jour" : "Envoyer un email de confirmation"}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  {isEditMode
                    ? "Partagez un récapitulatif actualisé avec le client après vos modifications."
                    : "Un récapitulatif sera envoyé au client pour confirmer la réservation."}
                </p>
              </div>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
});

