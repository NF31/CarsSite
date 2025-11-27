import { useMemo, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { clientDateTimeFormatter } from "@/components/admin/clients/client-helpers";
import { formatDateTimeLocal } from "@/components/admin/clients/edit/utils";
import type { ClientDetail } from "@/actions/admin/clients";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(80, "Le nom est trop long"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "locked"]),
  lockedUntil: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

type StatusOption = "active" | "inactive" | "locked";

export function useClientEditForm(client: ClientDetail) {
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

  return {
    form,
    defaultStatus,
    selectedStatus,
    lockedUntilValue,
    accountAge,
    lastUpdate,
    lastActivity,
    isCurrentlyLocked,
    totalAmountFormatted,
    averageAmountFormatted,
  };
}

