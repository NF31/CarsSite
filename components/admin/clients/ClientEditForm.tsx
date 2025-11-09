"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { updateClientAction } from "@/actions/admin/clients/update-client";
import type { ClientDetail } from "@/actions/admin/clients/get-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_LABELS,
  clientDateFormatter,
  clientDateTimeFormatter,
} from "./client-helpers";
import {
  AlertCircle,
  ArrowLeft,
  CalendarRange,
  Loader2,
  Lock,
  Shield,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

type StatusOption = "active" | "inactive" | "locked";

interface ClientEditFormProps {
  client: ClientDetail;
}

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(80, "Le nom est trop long"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "locked"]),
  lockedUntil: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const statusOptions: { value: StatusOption; label: string }[] = [
  { value: "active", label: CLIENT_STATUS_LABELS.ACTIVE },
  { value: "inactive", label: CLIENT_STATUS_LABELS.INACTIVE },
  { value: "locked", label: CLIENT_STATUS_LABELS.LOCKED },
];

const formatDateTimeLocal = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

export function ClientEditForm({ client }: ClientEditFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canCreateReservation = !client.deletedAt && client.status === "ACTIVE";

  const defaultStatus: StatusOption = useMemo(() => {
    if (client.deletedAt) {
      return "inactive";
    }
    if (client.lockedUntil && new Date(client.lockedUntil) > new Date()) {
      return "locked";
    }
    return "active";
  }, [client.deletedAt, client.lockedUntil]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client.name,
      email: client.email,
      phone: client.phone ?? undefined,
      status: defaultStatus,
      lockedUntil:
        defaultStatus === "locked"
          ? formatDateTimeLocal(client.lockedUntil)
          : "",
    },
  });

  useEffect(() => {
    form.setValue("status", defaultStatus);
    form.setValue(
      "lockedUntil",
      defaultStatus === "locked"
        ? formatDateTimeLocal(client.lockedUntil)
        : ""
    );
  }, [client.lockedUntil, defaultStatus, form]);

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);

    const nowTimestamp = new Date().getTime();

    if (values.status === "locked") {
      if (!values.lockedUntil || values.lockedUntil.trim().length === 0) {
        form.setError("lockedUntil", {
          message: "Veuillez indiquer une date de déverrouillage.",
        });
        return;
      }
      const parsed = new Date(values.lockedUntil);
      if (Number.isNaN(parsed.getTime())) {
        form.setError("lockedUntil", {
          message: "Date de déverrouillage invalide.",
        });
        return;
      }
      if (parsed.getTime() <= nowTimestamp) {
        form.setError("lockedUntil", {
          message: "La date doit être ultérieure à l'instant présent.",
        });
        return;
      }
    }

    const trimmedName = values.name.trim();
    const trimmedEmail = values.email.trim().toLowerCase();
    const normalizedPhone = values.phone?.trim().replace(/\s+/g, " ");

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: normalizedPhone && normalizedPhone.length > 0 ? normalizedPhone : undefined,
      status: values.status,
      lockedUntil:
        values.status === "locked" && values.lockedUntil
          ? new Date(values.lockedUntil).toISOString()
          : null,
    };

    startTransition(async () => {
      const result = await updateClientAction(client.id, payload);

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            const message = messages?.[0];
            if (message) {
              form.setError(field as keyof FormValues, {
                message,
              });
            }
          });
        }
        setServerError(result.error ?? "Impossible de mettre à jour ce client.");
        return;
      }

      router.push("/admin/clients?success=client-updated");
    });
  });

  const selectedStatus =
    useWatch({ control: form.control, name: "status" }) ?? defaultStatus;
  const lockedUntilValue =
    useWatch({ control: form.control, name: "lockedUntil" }) ?? "";

  const accountAge = useMemo(
    () =>
      formatDistanceStrict(new Date(client.createdAt), new Date(), {
        locale: fr,
      }),
    [client.createdAt]
  );
  const lastUpdate = useMemo(
    () => clientDateTimeFormatter.format(new Date(client.updatedAt)),
    [client.updatedAt]
  );
  const lastActivity = useMemo(
    () =>
      client.stats.lastBookingDate
        ? clientDateTimeFormatter.format(new Date(client.stats.lastBookingDate))
        : "Aucune réservation",
    [client.stats.lastBookingDate]
  );
  const isCurrentlyLocked = useMemo(() => {
    if (!client.lockedUntil) {
      return false;
    }
    return new Date(client.lockedUntil) > new Date();
  }, [client.lockedUntil]);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }),
    []
  );
  const totalAmountFormatted = useMemo(
    () => currencyFormatter.format(client.stats.totalAmountSpent),
    [client.stats.totalAmountSpent, currencyFormatter]
  );
  const averageAmountFormatted = useMemo(
    () => currencyFormatter.format(client.stats.averageAmountSpent),
    [client.stats.averageAmountSpent, currencyFormatter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href={`/admin/clients/${client.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la fiche client
          </Link>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Modifier {client.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                  CLIENT_STATUS_COLORS[client.status],
                )}
              >
                {CLIENT_STATUS_LABELS[client.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ajustez les coordonnées, le statut et les restrictions d’accès. Les modifications sont
              immédiatement prises en compte.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                ID client&nbsp;: <span className="font-mono">{client.id}</span>
              </span>
              <span className="text-gray-300">•</span>
              <span>Compte créé il y a {accountAge}</span>
              <span className="text-gray-300">•</span>
              <span>Dernière mise à jour {lastUpdate}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canCreateReservation ? (
            <Link href={`/admin/bookings/add?clientId=${client.id}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <User className="mr-2 h-4 w-4" />
                Nouvelle réservation
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="w-full sm:w-auto opacity-60"
              disabled
              title="Client inactif : réactivez le compte avant de créer une réservation."
            >
              <User className="mr-2 h-4 w-4" />
              Nouvelle réservation
            </Button>
          )}
          <Link href={`/admin/clients/${client.id}`}>
            <Button className="w-full sm:w-auto">Voir la fiche</Button>
          </Link>
        </div>
      </div>

      {serverError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{serverError}</span>
          </div>
          <button
            type="button"
            className="text-xs font-medium uppercase tracking-wide hover:underline"
            onClick={() => setServerError(null)}
          >
            Fermer
          </button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Informations de contact
                </CardTitle>
                <CardDescription>
                  Utilisées pour les confirmations de réservations et la communication commerciale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom et prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="client@example.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="Numéro de téléphone" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

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
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarRange className="h-5 w-5 text-primary" />
                Activité et réservations
              </CardTitle>
              <CardDescription>
                Suivi des performances et de la fidélité de ce client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Réservations totales
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {client.stats.totalBookings}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {client.stats.completedBookings} terminées
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Dernière réservation
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{lastActivity}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Montant dépensé
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {totalAmountFormatted}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>
                  Première réservation&nbsp;:&nbsp;
                  {client.stats.firstBookingDate
                    ? clientDateFormatter.format(new Date(client.stats.firstBookingDate))
                    : "Non disponible"}
                </span>
                <span className="text-gray-300">•</span>
                <span>
                  Panier moyen&nbsp;:&nbsp;
                  {averageAmountFormatted}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/admin/clients/${client.id}`} className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


