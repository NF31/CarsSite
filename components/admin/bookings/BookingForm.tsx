"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingStatus, ServicePricingType, VehicleStatus } from "@prisma/client";
import type {
  BookingLocationOption,
  BookingServiceOption,
  BookingUserOption,
  BookingVehicleOption,
  VehicleAvailabilityResponse,
} from "@/actions/admin/bookings";
import {
  createBookingAction,
  checkVehicleAvailabilityAction,
  createQuickClientAction,
} from "@/actions/admin/bookings";
import {
  Form,
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Euro,
  FileWarning,
  ShieldCheck,
  UploadCloud,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quickClientSchema, type QuickClientInput } from "@/lib/validations/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { DriverLicenseUpload } from "./DriverLicenseUpload";
import { useRouter } from "next/navigation";

const statusLabels: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "En attente",
  [BookingStatus.CONFIRMED]: "Confirmée",
  [BookingStatus.IN_PROGRESS]: "En cours",
  [BookingStatus.COMPLETED]: "Terminée",
  [BookingStatus.CANCELLED]: "Annulée",
};

const bookingFormSchema = z.object({
  userId: z.string().min(1, "Sélectionnez un client"),
  vehicleId: z.string().min(1, "Sélectionnez un véhicule"),
  pickupLocationId: z.string().min(1, "Sélectionnez une agence de départ"),
  returnLocationId: z.string().min(1, "Sélectionnez une agence de retour"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  status: z.nativeEnum(BookingStatus),
  serviceIds: z.array(z.string()).optional(),
  totalPrice: z.coerce.number().min(0, "Montant total invalide"),
  depositPaid: z.coerce.number().min(0, "Acompte invalide"),
  notes: z
    .string()
    .max(1000, "1 000 caractères maximum")
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  sendConfirmation: z.boolean().optional().default(true),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  users: BookingUserOption[];
  vehicles: BookingVehicleOption[];
  locations: BookingLocationOption[];
  services: BookingServiceOption[];
}

const toDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DRIVER_LICENSE_COOLDOWN_DAYS = 21;
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

export function BookingForm({ users, vehicles, locations, services }: BookingFormProps) {
  const router = useRouter();
  const [userOptions, setUserOptions] = useState(users);
  const [serverError, setServerError] = useState<string | null>(null);
  const [autoPricing, setAutoPricing] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isCheckingAvailability, startAvailabilityTransition] = useTransition();
  const [availability, setAvailability] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | { status: "available" }
    | { status: "booking_conflict"; message: string }
    | { status: "maintenance_conflict"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientServerError, setClientServerError] = useState<string | null>(null);
  const [isCreatingClient, startCreateClient] = useTransition();
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: {
      userId: "",
      vehicleId: "",
      pickupLocationId: "",
      returnLocationId: "",
      startDate: "",
      endDate: "",
      status: BookingStatus.CONFIRMED,
      serviceIds: [],
      totalPrice: 0,
      depositPaid: 0,
      notes: "",
      sendConfirmation: true,
    },
  });

  const quickClientForm = useForm<QuickClientInput>({
    resolver: zodResolver(quickClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      sendInvitation: false,
    },
  });

  const watchUserId = form.watch("userId");
  const watchVehicleId = form.watch("vehicleId");
  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");
  const watchServiceIds = form.watch("serviceIds") ?? [];
  const watchTotalPrice = form.watch("totalPrice");
  const watchDepositPaid = form.watch("depositPaid");

  const selectedUser = useMemo(
    () => userOptions.find((user) => user.id === watchUserId) ?? null,
    [userOptions, watchUserId]
  );

  const driverLicenseUploadInfo = useMemo(() => {
    if (!selectedUser) {
      return null;
    }

    const rawCount = selectedUser.driverLicenseUploadCount ?? 0;
    const lastUploadedAt = selectedUser.driverLicenseLastUploadedAt
      ? new Date(selectedUser.driverLicenseLastUploadedAt)
      : null;
    const now = Date.now();
    const cooldownMs = DRIVER_LICENSE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

    let normalizedCount = rawCount;
    let lastWithinWindow = lastUploadedAt;

    if (lastUploadedAt && now - lastUploadedAt.getTime() > cooldownMs) {
      normalizedCount = 0;
      lastWithinWindow = null;
    }

    const remaining = Math.max(DRIVER_LICENSE_MAX_REPLACEMENTS - normalizedCount, 0);
    const nextAllowedAt =
      remaining === 0 && lastWithinWindow
        ? new Date(lastWithinWindow.getTime() + cooldownMs)
        : null;

    return {
      normalizedCount,
      remaining,
      nextAllowedAt,
      lastWithinWindow,
    };
  }, [
    selectedUser?.driverLicenseUploadCount,
    selectedUser?.driverLicenseLastUploadedAt,
    selectedUser?.id,
  ]);

  const isDriverLicenseUploadBlocked = Boolean(
    driverLicenseUploadInfo && driverLicenseUploadInfo.remaining === 0 && driverLicenseUploadInfo.nextAllowedAt
  );

  const isLicenseMissing = selectedUser ? !selectedUser.hasDriverLicense : false;

  const minDateTimeValue = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === watchVehicleId) ?? null,
    [vehicles, watchVehicleId]
  );

  const selectedServices = useMemo(
    () => services.filter((service) => watchServiceIds.includes(service.id)),
    [services, watchServiceIds]
  );

  useEffect(() => {
    if (selectedVehicle) {
      if (!form.getValues("pickupLocationId") && selectedVehicle.location) {
        form.setValue("pickupLocationId", selectedVehicle.location.id, { shouldDirty: false });
      }
      if (!form.getValues("returnLocationId") && selectedVehicle.location) {
        form.setValue("returnLocationId", selectedVehicle.location.id, { shouldDirty: false });
      }
    }
  }, [selectedVehicle, form]);

  const pricingInfo = useMemo(() => {
    const start = toDate(watchStartDate);
    const end = toDate(watchEndDate);

    if (!selectedVehicle || !start || !end || end <= start) {
      return {
        durationDays: 0,
        basePrice: 0,
        servicesAmount: 0,
        total: Math.max(form.getValues("totalPrice"), 0),
        recommendedDeposit: selectedVehicle?.deposit ?? 0,
      };
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const rawDays = Math.ceil((end.getTime() - start.getTime()) / msPerDay);
    const durationDays = Math.max(rawDays, 1);

    const basePrice = selectedVehicle.pricePerDay * durationDays;

    const servicesAmount = selectedServices.reduce((total, service) => {
      switch (service.pricingType) {
        case ServicePricingType.PER_DAY:
          return total + service.price * durationDays;
        case ServicePricingType.PERCENTAGE:
          return total + (basePrice * service.price) / 100;
        case ServicePricingType.FIXED:
        default:
          return total + service.price;
      }
    }, 0);

    const total = basePrice + servicesAmount;
    const recommendedDeposit =
      selectedVehicle.deposit > 0 ? Math.min(selectedVehicle.deposit, total) : 0;

    return {
      durationDays,
      basePrice,
      servicesAmount,
      total,
      recommendedDeposit,
    };
  }, [form, selectedServices, selectedVehicle, watchStartDate, watchEndDate]);

  const computedTotal = pricingInfo.total;

  useEffect(() => {
    if (!autoPricing) {
      return;
    }

    if (Number.isFinite(computedTotal)) {
      form.setValue("totalPrice", Number(computedTotal.toFixed(2)), {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [autoPricing, form, computedTotal]);

  const remainingAmount = useMemo(
    () => Math.max(Number(watchTotalPrice) - Number(watchDepositPaid), 0),
    [watchTotalPrice, watchDepositPaid]
  );

  useEffect(() => {
    const start = toDate(watchStartDate);
    const end = toDate(watchEndDate);

    if (!watchVehicleId) {
      setAvailability({ status: "idle" });
      return;
    }

    if (!start || !end) {
      setAvailability({ status: "idle" });
      return;
    }

    if (end <= start) {
      setAvailability({
        status: "error",
        message: "La date de fin doit être postérieure à la date de début.",
      });
      return;
    }

    const now = new Date();
    if (start < now || end < now) {
      setAvailability({
        status: "error",
        message: "Les dates passées ne peuvent pas être sélectionnées.",
      });
      return;
    }

    setAvailability({ status: "checking" });
    startAvailabilityTransition(async () => {
      const result: VehicleAvailabilityResponse = await checkVehicleAvailabilityAction({
        vehicleId: watchVehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      if (!result.success) {
        setAvailability({ status: "error", message: result.error });
        return;
      }

      if (result.status === "available") {
        setAvailability({ status: "available" });
        return;
      }

      if (result.status === "booking_conflict") {
        setAvailability({
          status: "booking_conflict",
          message: `Réservation existante (${result.conflict.reference}) du ${format(
            new Date(result.conflict.startDate),
            "dd/MM/yyyy HH:mm",
            { locale: fr }
          )} au ${format(new Date(result.conflict.endDate), "dd/MM/yyyy HH:mm", { locale: fr })}.`,
        });
        return;
      }

      if (result.status === "maintenance_conflict") {
        setAvailability({
          status: "maintenance_conflict",
          message: `Maintenance planifiée (${result.maintenance.type.toLowerCase()}) du ${format(
            new Date(result.maintenance.startDate),
            "dd/MM/yyyy HH:mm",
            { locale: fr }
          )} au ${format(new Date(result.maintenance.endDate), "dd/MM/yyyy HH:mm", { locale: fr })}.`,
        });
      }
    });
  }, [watchVehicleId, watchStartDate, watchEndDate]);

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);

    const start = toDate(values.startDate);
    const end = toDate(values.endDate);
    const now = new Date();

    if (!start || !end) {
      form.setError("startDate", { message: "Dates invalides" });
      form.setError("endDate", { message: "Dates invalides" });
      return;
    }

    if (end <= start) {
      form.setError("endDate", { message: "La date de fin doit être postérieure à la date de début" });
      return;
    }

    if (start < now) {
      form.setError("startDate", { message: "La date de début doit être dans le futur" });
      return;
    }

    if (end < now) {
      form.setError("endDate", { message: "La date de fin doit être dans le futur" });
      return;
    }

    if (availability.status === "booking_conflict" || availability.status === "maintenance_conflict") {
      setServerError("Le véhicule n&apos;est pas disponible aux dates sélectionnées.");
      return;
    }

    if (values.totalPrice < values.depositPaid) {
      form.setError("depositPaid", {
        message: "L&apos;acompte ne peut pas dépasser le montant total",
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        userId: values.userId,
        vehicleId: values.vehicleId,
        pickupLocationId: values.pickupLocationId,
        returnLocationId: values.returnLocationId,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        serviceIds: values.serviceIds ?? [],
        totalPrice: Number(values.totalPrice),
        depositPaid: Number(values.depositPaid),
        notes: values.notes,
        sendConfirmation: values.sendConfirmation ?? true,
      };

      const result = await createBookingAction(payload);

      if (!result.success) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            const message = messages?.[0];
            if (message) {
              form.setError(field as keyof BookingFormValues, {
                message,
              });
            }
          });
        }
        setServerError(result.error);
        return;
      }

      router.push("/admin/bookings?success=booking-created");
    });
  });

  const isSubmitDisabled =
    isPending ||
    isCheckingAvailability ||
    availability.status === "booking_conflict" ||
    availability.status === "maintenance_conflict" ||
    (selectedUser ? isLicenseMissing : false);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Réservations • Création manuelle
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle réservation</h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez un client, un véhicule et définissez les conditions de location. Vous pouvez ajuster les tarifs si nécessaire.
        </p>
      </header>

      {serverError && (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <AlertCircle className="h-5 w-5" />
            {serverError}
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                          / {DRIVER_LICENSE_MAX_REPLACEMENTS}
                          {driverLicenseUploadInfo.nextAllowedAt && (
                            <>
                              {" "}
                              • Prochain remplacement possible le{" "}
                              <span className="font-medium text-gray-900">
                                {DATE_FORMATTER.format(driverLicenseUploadInfo.nextAllowedAt)}
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
                    onClick={() => setIsLicenseDialogOpen(true)}
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
                  onClick={() => setIsClientDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Ajouter un nouveau client
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Véhicule et statut</CardTitle>
              <CardDescription>
                Sélectionnez un véhicule disponible et définissez le statut initial de la réservation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full min-h-[48px]">
                        <SelectValue placeholder="Sélectionnez un véhicule">
                          {selectedVehicle ? (
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-medium text-gray-900">
                                {selectedVehicle.label}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {FORMATTER.format(selectedVehicle.pricePerDay)} / jour • Dépôt recommandé{" "}
                                {FORMATTER.format(selectedVehicle.deposit)}
                              </span>
                            </div>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-gray-900">{vehicle.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {FORMATTER.format(vehicle.pricePerDay)} / jour • Dépôt recommandé{" "}
                                {FORMATTER.format(vehicle.deposit)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {vehicle.location
                                  ? `${vehicle.location.name} • ${vehicle.location.city}`
                                  : "Agence non renseignée"}
                              </span>
                              <span className="text-xs">
                                <Badge
                                  variant={
                                    vehicle.status === VehicleStatus.AVAILABLE ? "default" : "secondary"
                                  }
                                >
                                  {vehicle.status === VehicleStatus.AVAILABLE
                                    ? "Disponible"
                                    : vehicle.status === VehicleStatus.RESERVED
                                    ? "Réservé"
                                    : vehicle.status === VehicleStatus.MAINTENANCE
                                    ? "Maintenance"
                                    : "Indisponible"}
                                </Badge>
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut initial</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisissez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BookingStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates et période</CardTitle>
              <CardDescription>Définissez la durée de la location.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début de la location</FormLabel>
                    <Input
                      type="datetime-local"
                      value={field.value}
                      onChange={field.onChange}
                      min={minDateTimeValue}
                      disabled={!watchVehicleId}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin de la location</FormLabel>
                    <Input
                      type="datetime-local"
                      value={field.value}
                      onChange={field.onChange}
                      min={minDateTimeValue}
                      disabled={!watchVehicleId}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-sm",
                    availability.status === "available"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : availability.status === "booking_conflict" ||
                          availability.status === "maintenance_conflict"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : availability.status === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-border bg-muted/40 text-muted-foreground"
                  )}
                >
                  {availability.status === "checking" || isCheckingAvailability
                    ? "Vérification des disponibilités en cours..."
                    : availability.status === "available"
                    ? "Le véhicule est disponible pour les dates sélectionnées."
                    : availability.status === "booking_conflict" ||
                        availability.status === "maintenance_conflict"
                    ? availability.message
                    : availability.status === "error"
                    ? availability.message
                    : "Sélectionnez un véhicule et des dates pour vérifier la disponibilité."}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!watchVehicleId}
                  asChild
                >
                  <Link
                    href={
                      watchVehicleId
                        ? `/admin/vehicles/availability?vehicle=${watchVehicleId}`
                        : "/admin/vehicles/availability"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consulter le planning du véhicule
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agences de prise en charge / retour</CardTitle>
              <CardDescription>Sélectionnez les agences concernées.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="pickupLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence de départ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une agence" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} • {location.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="returnLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agence de retour</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une agence" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name} • {location.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services additionnels</CardTitle>
              <CardDescription>Ajoutez des options tarifaires pour cette réservation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                  Aucun service additionnel n&apos;est disponible pour le moment.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1 rounded-lg border p-4 text-sm transition",
                        watchServiceIds.includes(service.id)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/40 hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{service.name}</span>
                        <Checkbox
                          checked={watchServiceIds.includes(service.id)}
                          onCheckedChange={(checked) => {
                            const current = new Set(watchServiceIds);
                            if (checked) {
                              current.add(service.id);
                            } else {
                              current.delete(service.id);
                            }
                            form.setValue("serviceIds", Array.from(current), { shouldDirty: true });
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {service.pricingType === ServicePricingType.FIXED && (
                          <span>+ {FORMATTER.format(service.price)}</span>
                        )}
                        {service.pricingType === ServicePricingType.PER_DAY && (
                          <span>+ {FORMATTER.format(service.price)} / jour</span>
                        )}
                        {service.pricingType === ServicePricingType.PERCENTAGE && (
                          <span>+ {service.price}% du montant du véhicule</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarification & acompte</CardTitle>
              <CardDescription>
                Calcul automatique basé sur le véhicule sélectionné et la durée. Vous pouvez ajuster manuellement si besoin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Tarification automatique</p>
                  <p className="text-xs text-muted-foreground">
                    Désactivez pour modifier librement les montants.
                  </p>
                </div>
                <Switch checked={autoPricing} onCheckedChange={setAutoPricing} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant total</FormLabel>
                      <div className="relative">
                        <Input type="number" step="0.01" min={0} disabled={isPending} {...field} />
                        <Euro className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="depositPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acompte perçu</FormLabel>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          disabled={autoPricing || isPending}
                          {...field}
                        />
                        <Euro className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Reste à payer</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {FORMATTER.format(remainingAmount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Durée estimée</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {pricingInfo.durationDays > 0 ? `${pricingInfo.durationDays} jour(s)` : "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Montant véhicule</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {FORMATTER.format(pricingInfo.basePrice)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Services additionnels</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {FORMATTER.format(pricingInfo.servicesAmount)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-xs text-muted-foreground">Acompte recommandé</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {FORMATTER.format(pricingInfo.recommendedDeposit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                      <FormLabel>Envoyer un email de confirmation</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Un récapitulatif sera envoyé au client (fonctionnalité à finaliser).
                      </p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/bookings">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isPending ? "Création en cours..." : "Créer la réservation"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Permis de conduire du client</DialogTitle>
            <DialogDescription>
              Téléversez un PDF sécurisé du permis de conduire. Le document est stocké dans un dossier privé.
            </DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <DriverLicenseUpload
              userId={selectedUser.id}
              userName={selectedUser.name}
              existingUrl={selectedUser.driverLicenseUrl}
              uploadCount={driverLicenseUploadInfo?.normalizedCount ?? 0}
              lastUploadedAt={
                driverLicenseUploadInfo?.lastWithinWindow
                  ? driverLicenseUploadInfo.lastWithinWindow.toISOString()
                  : null
              }
              maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
              cooldownDays={DRIVER_LICENSE_COOLDOWN_DAYS}
              onUploaded={({ url, publicId, uploadCount, lastUploadedAt }) => {
                setUserOptions((prev) =>
                  prev.map((user) =>
                    user.id === selectedUser.id
                      ? {
                          ...user,
                          hasDriverLicense: true,
                          driverLicenseUrl: url,
                          driverLicensePublicId: publicId,
                          driverLicenseUploadCount: uploadCount,
                          driverLicenseLastUploadedAt: lastUploadedAt,
                        }
                      : user
                  )
                );
                form.setValue("userId", selectedUser.id, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setIsLicenseDialogOpen(false);
              }}
              onDismiss={() => setIsLicenseDialogOpen(false)}
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
              Sélectionnez un client avant d&apos;ajouter un permis de conduire.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>
              Créez rapidement un client pour l&apos;associer à cette réservation.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={quickClientForm.handleSubmit((values) => {
              setClientServerError(null);
              startCreateClient(async () => {
                const result = await createQuickClientAction({
                  name: values.name,
                  email: values.email,
                  phone: values.phone ?? undefined,
                  sendInvitation: values.sendInvitation ?? false,
                });

                if (!result.success) {
                  if (result.fieldErrors) {
                    Object.entries(result.fieldErrors).forEach(([field, messages]) => {
                      const message = messages?.[0];
                      if (message) {
                        quickClientForm.setError(field as keyof QuickClientInput, {
                          message,
                        });
                      }
                    });
                  }
                  setClientServerError(result.error);
                  return;
                }

                setUserOptions((prev) =>
                  [...prev, result.data].sort((a, b) =>
                    a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
                  )
                );
                form.setValue("userId", result.data.id, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setIsClientDialogOpen(false);
                quickClientForm.reset();
              });
            })}
            className="space-y-4"
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nom complet</Label>
                <Input
                  id="client-name"
                  placeholder="Ex. Jean Dupont"
                  {...quickClientForm.register("name")}
                />
                {quickClientForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {quickClientForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="client@email.com"
                  {...quickClientForm.register("email")}
                />
                {quickClientForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {quickClientForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Téléphone (optionnel)</Label>
                <Input
                  id="client-phone"
                  placeholder="+33 6 12 34 56 78"
                  {...quickClientForm.register("phone")}
                />
                {quickClientForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {quickClientForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={quickClientForm.watch("sendInvitation")}
                  onCheckedChange={(checked) =>
                    quickClientForm.setValue("sendInvitation", Boolean(checked), {
                      shouldDirty: true,
                    })
                  }
                />
                Envoyer un email d&apos;invitation (prévu ultérieurement)
              </label>
              {clientServerError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {clientServerError}
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsClientDialogOpen(false);
                  quickClientForm.reset();
                  setClientServerError(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isCreatingClient}>
                {isCreatingClient ? "Création..." : "Créer le client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


