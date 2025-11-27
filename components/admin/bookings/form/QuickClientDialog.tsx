"use client";

import { memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quickClientSchema, type QuickClientInput } from "@/lib/validations/client";
import type { BookingUserOption } from "@/actions/admin/bookings";

interface QuickClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreatingClient: boolean;
  serverError: string | null;
  onCreateClient: (data: QuickClientInput) => Promise<BookingUserOption | null>;
  onClientCreated: (client: BookingUserOption) => void;
}

export const QuickClientDialog = memo(function QuickClientDialog({
  open,
  onOpenChange,
  isCreatingClient,
  serverError,
  onCreateClient,
  onClientCreated,
}: QuickClientDialogProps) {
  const form = useForm<QuickClientInput>({
    resolver: zodResolver(quickClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      sendInvitation: false,
    },
  });

  const sendInvitation = form.watch("sendInvitation");

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onCreateClient(values);
    if (result) {
      onClientCreated(result);
      form.reset();
      onOpenChange(false);
    }
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Créez rapidement un client pour l&apos;associer à cette réservation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nom complet</Label>
              <Input
                id="client-name"
                placeholder="Ex. Jean Dupont"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="client@email.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Téléphone (optionnel)</Label>
              <Input
                id="client-phone"
                placeholder="+33 6 12 34 56 78"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={Boolean(sendInvitation)}
                onCheckedChange={(checked) =>
                  form.setValue("sendInvitation", Boolean(checked), {
                    shouldDirty: true,
                  })
                }
              />
              Envoyer un email d&apos;invitation (prévu ultérieurement)
            </label>
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {serverError}
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreatingClient}>
              {isCreatingClient ? "Création..." : "Créer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

