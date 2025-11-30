"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Mail, RefreshCcw, Save } from "lucide-react";
import { useEmailForm } from "../hooks/use-email-form";
import { MessageAlert } from "./message-alert";
import { FormField } from "./form-field";
import type { SettingsPageClientProps } from "../types";

interface EmailFormProps {
  initialData: SettingsPageClientProps["initialData"]["emails"];
}

/**
 * Formulaire des paramètres d'email et notifications
 */
export function EmailForm({ initialData }: EmailFormProps) {
  const {
    form,
    setForm,
    errors,
    setErrors,
    message,
    setMessage,
    isUpdating,
    reset,
    handleSubmit,
  } = useEmailForm({ initialData });

  const handleFieldChange = (value: string, field: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleNotificationChange = (field: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: checked },
    }));
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Mail className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">
            Notifications & emails
          </span>
        </div>
        <CardTitle>Notifications automatiques</CardTitle>
        <CardDescription>
          Configurez l&apos;expéditeur et sélectionnez les notifications envoyées à vos clients
          automatiquement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <MessageAlert message={message} onClose={() => setMessage(null)} />

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="smtp-from-name"
                label="Nom de l'expéditeur"
                value={form.smtpFromName}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="smtpFromName"
                placeholder="CarRental"
              />

              <FormField
                id="smtp-from-email"
                label="Email de l'expéditeur"
                value={form.smtpFromEmail}
                onChange={handleFieldChange}
                errors={errors}
                fieldName="smtpFromEmail"
                placeholder="no-reply@carrental.com"
                type="email"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Choisissez les notifications envoyées automatiquement à vos clients.
              </p>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">Confirmation de réservation</p>
                    <p className="text-sm text-muted-foreground">
                      Email envoyé immédiatement après la création d&apos;une réservation.
                    </p>
                  </div>
                  <Switch
                    checked={form.notifications.bookingConfirmation}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("bookingConfirmation", checked)
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">Rappel de réservation</p>
                    <p className="text-sm text-muted-foreground">
                      Rappel envoyé 24h avant le début de la location.
                    </p>
                  </div>
                  <Switch
                    checked={form.notifications.bookingReminder}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("bookingReminder", checked)
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">Confirmation de paiement</p>
                    <p className="text-sm text-muted-foreground">
                      Confirmation envoyée après la réception d&apos;un paiement.
                    </p>
                  </div>
                  <Switch
                    checked={form.notifications.paymentConfirmation}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("paymentConfirmation", checked)
                    }
                  />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-medium text-gray-900">Notification d&apos;annulation</p>
                    <p className="text-sm text-muted-foreground">
                      Email envoyé en cas d&apos;annulation de réservation.
                    </p>
                  </div>
                  <Switch
                    checked={form.notifications.cancellationNotification}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("cancellationNotification", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={reset} disabled={isUpdating}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

