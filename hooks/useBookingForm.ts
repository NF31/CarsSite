import { useMemo, useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingStatus } from "@/lib/types/booking-status";
import { ServicePricingType } from "@prisma/client";
import { z } from "zod";
import type {
  BookingServiceOption,
  BookingUserOption,
  BookingVehicleOption,
} from "@/actions/admin/bookings";
import type { BookingFormInitialValues } from "@/components/admin/bookings/BookingForm";

const bookingFormSchema = z.object({
  userId: z.string().min(1, "Sélectionnez un client"),
  vehicleId: z.string().min(1, "Sélectionnez un véhicule"),
  pickupLocationId: z.string().min(1, "Sélectionnez une agence de départ"),
  returnLocationId: z.string().min(1, "Sélectionnez une agence de retour"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  status: z.nativeEnum(BookingStatus),
  serviceIds: z.array(z.string()).default([]),
  totalPrice: z.coerce.number().min(0, "Montant total invalide"),
  depositPaid: z.coerce.number().min(0, "Acompte invalide"),
  notes: z
    .string()
    .max(1000, "1 000 caractères maximum")
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  sendConfirmation: z.boolean(),
});

export type BookingFormValues = z.output<typeof bookingFormSchema>;

// Export du schéma pour utilisation dans les composants
export { bookingFormSchema };

const toDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DRIVER_LICENSE_COOLDOWN_DAYS = 21;

interface UseBookingFormProps {
  users: BookingUserOption[];
  vehicles: BookingVehicleOption[];
  services: BookingServiceOption[];
  mode?: "create" | "edit";
  booking?: BookingFormInitialValues;
}

export function useBookingForm({
  users,
  vehicles,
  services,
  mode = "create",
  booking,
}: UseBookingFormProps) {
  const isEditMode = mode === "edit";
  const [mountTimestamp] = useState(() => Date.now());
  const [userOptions, setUserOptions] = useState(users);
  const [autoPricing, setAutoPricing] = useState(!isEditMode);

  const defaultValues = useMemo<BookingFormValues>(
    () =>
      isEditMode && booking
        ? {
            userId: booking.userId,
            vehicleId: booking.vehicleId,
            pickupLocationId: booking.pickupLocationId,
            returnLocationId: booking.returnLocationId,
            startDate: booking.startDate,
            endDate: booking.endDate,
            status: BookingStatus.CONFIRMED,
            serviceIds: booking.serviceIds ?? [],
            totalPrice: booking.totalPrice,
            depositPaid: booking.depositPaid,
            notes: booking.notes ?? "",
            sendConfirmation: false,
          }
        : {
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
    [isEditMode, booking]
  );

  const form = useForm<z.input<typeof bookingFormSchema>, unknown, BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    if (isEditMode) {
      form.setValue("status", BookingStatus.CONFIRMED, { shouldDirty: false });
    }
  }, [form, isEditMode]);

  const watchUserId = useWatch({ control: form.control, name: "userId" });
  const watchVehicleId = useWatch({ control: form.control, name: "vehicleId" });
  const watchStartDate = useWatch({ control: form.control, name: "startDate" });
  const watchEndDate = useWatch({ control: form.control, name: "endDate" });
  const watchServiceIdsValue = useWatch({ control: form.control, name: "serviceIds" });
  const watchServiceIds = useMemo(() => watchServiceIdsValue ?? [], [watchServiceIdsValue]);
  const watchTotalPrice = useWatch({ control: form.control, name: "totalPrice" });
  const watchDepositPaid = useWatch({ control: form.control, name: "depositPaid" });

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
    const now = mountTimestamp;
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
  }, [selectedUser, mountTimestamp]);

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
        total: Math.max(Number(form.getValues("totalPrice")) || 0, 0),
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

  const updateUserOptions = useCallback((updater: (prev: BookingUserOption[]) => BookingUserOption[]) => {
    setUserOptions(updater);
  }, []);

  return {
    form,
    isEditMode,
    userOptions,
    setUserOptions: updateUserOptions,
    autoPricing,
    setAutoPricing,
    selectedUser,
    driverLicenseUploadInfo,
    isDriverLicenseUploadBlocked,
    isLicenseMissing,
    minDateTimeValue,
    selectedVehicle,
    selectedServices,
    pricingInfo,
    remainingAmount,
    watchUserId,
    watchVehicleId,
    watchStartDate,
    watchEndDate,
    watchServiceIds,
    watchTotalPrice,
    watchDepositPaid,
  };
}

