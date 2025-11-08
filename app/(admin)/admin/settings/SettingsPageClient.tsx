"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { AdminSettingsData } from "@/types/admin-settings";
import {
  updateAgencySettingsAction,
  updateConfigurationSettingsAction,
  updateEmailSettingsAction,
} from "@/actions/admin/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Cog,
  Mail,
  RefreshCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { FormEvent } from "react";

type FieldErrors = Record<string, string[]>;

interface SettingsPageClientProps {
  initialData: AdminSettingsData;
}

const parseNumberInput = (value: string) => {
  const normalized = value.replace(",", ".").trim();
  if (normalized.length === 0) {
    return Number.NaN;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const getFirstError = (errors: FieldErrors, field: string) =>
  errors[field]?.[0] ?? undefined;

export function SettingsPageClient({ initialData }: SettingsPageClientProps) {
  const initialAgency = useMemo(
    () => ({
      name: initialData.agency.name ?? "",
      logoUrl: initialData.agency.logoUrl ?? "",
      address: initialData.agency.address ?? "",
      phone: initialData.agency.phone ?? "",
      email: initialData.agency.email ?? "",
      openingHours: initialData.agency.openingHours ?? "",
    }),
    [initialData],
  );

  const initialConfiguration = useMemo(
    () => ({
      currency: initialData.configuration.currency ?? "",
      language: initialData.configuration.language ?? "",
      timezone: initialData.configuration.timezone ?? "",
      cancellationPolicy: initialData.configuration.cancellationPolicy ?? "",
      taxRate: String(initialData.configuration.taxRate ?? ""),
      deposit: String(initialData.configuration.deposit ?? ""),
      serviceFee: String(initialData.configuration.serviceFee ?? ""),
    }),
    [initialData],
  );

  const initialEmail = useMemo(
    () => ({
      smtpFromName: initialData.emails.smtpFromName ?? "",
      smtpFromEmail: initialData.emails.smtpFromEmail ?? "",
      notifications: {
        bookingConfirmation: initialData.emails.notifications.bookingConfirmation ?? true,
        bookingReminder: initialData.emails.notifications.bookingReminder ?? true,
        paymentConfirmation: initialData.emails.notifications.paymentConfirmation ?? true,
        cancellationNotification:
          initialData.emails.notifications.cancellationNotification ?? true,
      },
    }),
    [initialData],
  );

  const [agencyForm, setAgencyForm] = useState(initialAgency);
  const [configurationForm, setConfigurationForm] = useState(initialConfiguration);
  const [emailForm, setEmailForm] = useState(initialEmail);

  const [agencyErrors, setAgencyErrors] = useState<FieldErrors>({});
  const [configErrors, setConfigErrors] = useState<FieldErrors>({});
  const [emailErrors, setEmailErrors] = useState<FieldErrors>({});

  const [agencyMessage, setAgencyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [configMessage, setConfigMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isUpdatingAgency, startUpdateAgency] = useTransition();
  const [isUpdatingConfig, startUpdateConfig] = useTransition();
  const [isUpdatingEmail, startUpdateEmail] = useTransition();

  useEffect(() => {
    setAgencyForm(initialAgency);
    setConfigurationForm(initialConfiguration);
    setEmailForm(initialEmail);
  }, [initialAgency, initialConfiguration, initialEmail]);

  const resetAgency = useCallback(() => {
    setAgencyForm(initialAgency);
    setAgencyErrors({});
    setAgencyMessage(null);
  }, [initialAgency]);

  const resetConfiguration = useCallback(() => {
    setConfigurationForm(initialConfiguration);
    setConfigErrors({});
    setConfigMessage(null);
  }, [initialConfiguration]);

  const resetEmail = useCallback(() => {
    setEmailForm(initialEmail);
    setEmailErrors({});
    setEmailMessage(null);
  }, [initialEmail]);

  const handleAgencySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      startUpdateAgency(async () => {
        setAgencyErrors({});
        setAgencyMessage(null);

        const result = await updateAgencySettingsAction({
          name: agencyForm.name.trim(),
          logoUrl: agencyForm.logoUrl.trim(),
          address: agencyForm.address.trim(),
          phone: agencyForm.phone.trim(),
          email: agencyForm.email.trim(),
          openingHours: agencyForm.openingHours.trim(),
        });

        if (!result.success) {
          setAgencyMessage({
            type: "error",
            text: result.error ?? "Impossible de mettre à jour les informations de l'agence.",
          });
          if (result.fieldErrors) {
            setAgencyErrors(result.fieldErrors);
          }
          return;
        }

        setAgencyMessage({
          type: "success",
          text: result.message ?? "Informations de l'agence mises à jour.",
        });
      });
    },
    [agencyForm, startUpdateAgency],
  );

  const handleConfigurationSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      startUpdateConfig(async () => {
        setConfigErrors({});
        setConfigMessage(null);

        const payload = {
          currency: configurationForm.currency.trim(),
          language: configurationForm.language.trim(),
          timezone: configurationForm.timezone.trim(),
          cancellationPolicy: configurationForm.cancellationPolicy.trim(),
          taxRate: parseNumberInput(configurationForm.taxRate),
          deposit: parseNumberInput(configurationForm.deposit),
          serviceFee: parseNumberInput(configurationForm.serviceFee),
        };

        const result = await updateConfigurationSettingsAction(payload);

        if (!result.success) {
          setConfigMessage({
            type: "error",
            text: result.error ?? "Impossible de mettre à jour la configuration.",
          });
          if (result.fieldErrors) {
            setConfigErrors(result.fieldErrors);
          }
          return;
        }

        setConfigMessage({
          type: "success",
          text: result.message ?? "Configuration mise à jour.",
        });
      });
    },
    [configurationForm, startUpdateConfig],
  );

  const handleEmailSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      startUpdateEmail(async () => {
        setEmailErrors({});
        setEmailMessage(null);

        const payload = {
          smtpFromName: emailForm.smtpFromName.trim(),
          smtpFromEmail: emailForm.smtpFromEmail.trim(),
          bookingConfirmation: emailForm.notifications.bookingConfirmation,
          bookingReminder: emailForm.notifications.bookingReminder,
          paymentConfirmation: emailForm.notifications.paymentConfirmation,
          cancellationNotification: emailForm.notifications.cancellationNotification,
        };

        const result = await updateEmailSettingsAction(payload);

        if (!result.success) {
          setEmailMessage({
            type: "error",
            text: result.error ?? "Impossible de mettre à jour les paramètres d'email.",
          });
          if (result.fieldErrors) {
            setEmailErrors(result.fieldErrors);
          }
          return;
        }

        setEmailMessage({
          type: "success",
          text: result.message ?? "Paramètres d'email mis à jour.",
        });
      });
    },
    [emailForm, startUpdateEmail],
  );

  const renderMessage = (
    message: { type: "success" | "error"; text: string } | null,
    onClose: () => void,
  ) => {
    if (!message) {
      return null;
    }

    const isSuccess = message.type === "success";
    return (
      <div
        className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
          isSuccess
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message.text}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium uppercase tracking-wide text-current transition-opacity hover:opacity-70"
          aria-label="Fermer la notification"
        >
          Fermer
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Gérez la configuration globale de l&apos;agence, vos préférences et vos notifications
              automatiques.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">
                  Informations de l&apos;agence
                </span>
              </div>
              <CardTitle className="text-2xl">Identité et coordonnées</CardTitle>
              <CardDescription>
                Ces informations sont utilisées dans l&apos;interface client, les factures et les
                communications automatiques.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetAgency}
                disabled={isUpdatingAgency}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleAgencySubmit}>
              {renderMessage(agencyMessage, () => setAgencyMessage(null))}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agency-name">Nom de l&apos;agence</Label>
                  <Input
                    id="agency-name"
                    value={agencyForm.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAgencyForm((prev) => ({ ...prev, name: value }));
                      setAgencyErrors((prev) => {
                        if (!prev.name) return prev;
                        const { name, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="CarRental Paris"
                  />
                  {getFirstError(agencyErrors, "name") && (
                    <p className="text-sm text-red-600">{getFirstError(agencyErrors, "name")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency-logo">Logo (URL)</Label>
                  <Input
                    id="agency-logo"
                    value={agencyForm.logoUrl}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAgencyForm((prev) => ({ ...prev, logoUrl: value }));
                      setAgencyErrors((prev) => {
                        if (!prev.logoUrl) return prev;
                        const { logoUrl, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="https://..."
                  />
                  {getFirstError(agencyErrors, "logoUrl") && (
                    <p className="text-sm text-red-600">
                      {getFirstError(agencyErrors, "logoUrl")}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="agency-address">Adresse complète</Label>
                  <Textarea
                    id="agency-address"
                    value={agencyForm.address}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAgencyForm((prev) => ({ ...prev, address: value }));
                      setAgencyErrors((prev) => {
                        if (!prev.address) return prev;
                        const { address, ...rest } = prev;
                        return rest;
                      });
                    }}
                    rows={3}
                    placeholder="123 Avenue de la Liberté, 75000 Paris"
                  />
                  {getFirstError(agencyErrors, "address") && (
                    <p className="text-sm text-red-600">{getFirstError(agencyErrors, "address")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency-phone">Téléphone</Label>
                  <Input
                    id="agency-phone"
                    value={agencyForm.phone}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAgencyForm((prev) => ({ ...prev, phone: value }));
                      setAgencyErrors((prev) => {
                        if (!prev.phone) return prev;
                        const { phone, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="+33 1 23 45 67 89"
                  />
                  {getFirstError(agencyErrors, "phone") && (
                    <p className="text-sm text-red-600">{getFirstError(agencyErrors, "phone")}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agency-email">Email</Label>
                  <Input
                    id="agency-email"
                    type="email"
                    value={agencyForm.email}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAgencyForm((prev) => ({ ...prev, email: value }));
                      setAgencyErrors((prev) => {
                        if (!prev.email) return prev;
                        const { email, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="contact@carrental.com"
                  />
                  {getFirstError(agencyErrors, "email") && (
                    <p className="text-sm text-red-600">{getFirstError(agencyErrors, "email")}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="agency-hours">Horaires d&apos;ouverture</Label>
                  <Textarea
                    id="agency-hours"
                    value={agencyForm.openingHours}
                    onChange={(event) => {
                      const value = event.target.value;
                      setAgencyForm((prev) => ({ ...prev, openingHours: value }));
                      setAgencyErrors((prev) => {
                        if (!prev.openingHours) return prev;
                        const { openingHours, ...rest } = prev;
                        return rest;
                      });
                    }}
                    rows={2}
                    placeholder="Lun - Sam : 08h00 - 19h00"
                  />
                  {getFirstError(agencyErrors, "openingHours") && (
                    <p className="text-sm text-red-600">
                      {getFirstError(agencyErrors, "openingHours")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isUpdatingAgency}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingAgency ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Cog className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Configuration</span>
            </div>
            <CardTitle>Paramètres généraux</CardTitle>
            <CardDescription>
              Définissez les paramètres appliqués aux réservations, paiements et communications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleConfigurationSubmit}>
              {renderMessage(configMessage, () => setConfigMessage(null))}

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="config-currency">Devise</Label>
                    <Input
                      id="config-currency"
                      value={configurationForm.currency}
                      onChange={(event) => {
                        const value = event.target.value;
                        setConfigurationForm((prev) => ({ ...prev, currency: value }));
                        setConfigErrors((prev) => {
                          if (!prev.currency) return prev;
                          const { currency, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="EUR"
                    />
                    {getFirstError(configErrors, "currency") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(configErrors, "currency")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-language">Langue</Label>
                    <Input
                      id="config-language"
                      value={configurationForm.language}
                      onChange={(event) => {
                        const value = event.target.value;
                        setConfigurationForm((prev) => ({ ...prev, language: value }));
                        setConfigErrors((prev) => {
                          if (!prev.language) return prev;
                          const { language, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="fr"
                    />
                    {getFirstError(configErrors, "language") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(configErrors, "language")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-timezone">Fuseau horaire</Label>
                    <Input
                      id="config-timezone"
                      value={configurationForm.timezone}
                      onChange={(event) => {
                        const value = event.target.value;
                        setConfigurationForm((prev) => ({ ...prev, timezone: value }));
                        setConfigErrors((prev) => {
                          if (!prev.timezone) return prev;
                          const { timezone, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="Europe/Paris"
                    />
                    {getFirstError(configErrors, "timezone") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(configErrors, "timezone")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="config-cancellation">Politique d&apos;annulation</Label>
                  <Textarea
                    id="config-cancellation"
                    value={configurationForm.cancellationPolicy}
                    onChange={(event) => {
                      const value = event.target.value;
                      setConfigurationForm((prev) => ({
                        ...prev,
                        cancellationPolicy: value,
                      }));
                      setConfigErrors((prev) => {
                        if (!prev.cancellationPolicy) return prev;
                        const { cancellationPolicy, ...rest } = prev;
                        return rest;
                      });
                    }}
                    rows={3}
                    placeholder="Annulation gratuite jusqu'à 48h avant le départ..."
                  />
                  {getFirstError(configErrors, "cancellationPolicy") && (
                    <p className="text-sm text-red-600">
                      {getFirstError(configErrors, "cancellationPolicy")}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="config-tax">TVA (%)</Label>
                    <Input
                      id="config-tax"
                      value={configurationForm.taxRate}
                      onChange={(event) => {
                        const value = event.target.value;
                        setConfigurationForm((prev) => ({ ...prev, taxRate: value }));
                        setConfigErrors((prev) => {
                          if (!prev.taxRate) return prev;
                          const { taxRate, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="20"
                    />
                    {getFirstError(configErrors, "taxRate") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(configErrors, "taxRate")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-deposit">Dépôt de garantie</Label>
                    <Input
                      id="config-deposit"
                      value={configurationForm.deposit}
                      onChange={(event) => {
                        const value = event.target.value;
                        setConfigurationForm((prev) => ({ ...prev, deposit: value }));
                        setConfigErrors((prev) => {
                          if (!prev.deposit) return prev;
                          const { deposit, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="500"
                    />
                    {getFirstError(configErrors, "deposit") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(configErrors, "deposit")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="config-service-fee">Frais de service</Label>
                    <Input
                      id="config-service-fee"
                      value={configurationForm.serviceFee}
                      onChange={(event) => {
                        const value = event.target.value;
                        setConfigurationForm((prev) => ({ ...prev, serviceFee: value }));
                        setConfigErrors((prev) => {
                          if (!prev.serviceFee) return prev;
                          const { serviceFee, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="0"
                    />
                    {getFirstError(configErrors, "serviceFee") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(configErrors, "serviceFee")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetConfiguration}
                  disabled={isUpdatingConfig}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
                <Button type="submit" disabled={isUpdatingConfig}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingConfig ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
              Configurez l&apos;expéditeur et sélectionnez les notifications envoyées à vos
              clients automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              {renderMessage(emailMessage, () => setEmailMessage(null))}

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-name">Nom de l&apos;expéditeur</Label>
                    <Input
                      id="smtp-from-name"
                      value={emailForm.smtpFromName}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEmailForm((prev) => ({ ...prev, smtpFromName: value }));
                        setEmailErrors((prev) => {
                          if (!prev.smtpFromName) return prev;
                          const { smtpFromName, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="CarRental"
                    />
                    {getFirstError(emailErrors, "smtpFromName") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(emailErrors, "smtpFromName")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-email">Email de l&apos;expéditeur</Label>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      value={emailForm.smtpFromEmail}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEmailForm((prev) => ({ ...prev, smtpFromEmail: value }));
                        setEmailErrors((prev) => {
                          if (!prev.smtpFromEmail) return prev;
                          const { smtpFromEmail, ...rest } = prev;
                          return rest;
                        });
                      }}
                      placeholder="no-reply@carrental.com"
                    />
                    {getFirstError(emailErrors, "smtpFromEmail") && (
                      <p className="text-sm text-red-600">
                        {getFirstError(emailErrors, "smtpFromEmail")}
                      </p>
                    )}
                  </div>
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
                        checked={emailForm.notifications.bookingConfirmation}
                        onCheckedChange={(checked) =>
                          setEmailForm((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, bookingConfirmation: checked },
                          }))
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
                        checked={emailForm.notifications.bookingReminder}
                        onCheckedChange={(checked) =>
                          setEmailForm((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, bookingReminder: checked },
                          }))
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
                        checked={emailForm.notifications.paymentConfirmation}
                        onCheckedChange={(checked) =>
                          setEmailForm((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, paymentConfirmation: checked },
                          }))
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
                        checked={emailForm.notifications.cancellationNotification}
                        onCheckedChange={(checked) =>
                          setEmailForm((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              cancellationNotification: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={resetEmail} disabled={isUpdatingEmail}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
                <Button type="submit" disabled={isUpdatingEmail}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdatingEmail ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


