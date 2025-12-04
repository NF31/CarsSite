"use client";

import { useState } from "react";
import { FormProvider } from "react-hook-form";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type {
  BookingLocationOption,
  BookingServiceOption,
  BookingUserOption,
  BookingVehicleOption,
} from "@/actions/admin/bookings";
import { BookingStatus } from "@prisma/client";

export interface BookingFormInitialValues {
  id: string;
  reference: string;
  userId: string;
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  serviceIds: string[];
  totalPrice: number;
  depositPaid: number;
  notes: string | null;
}
import { useBookingForm } from "@/hooks/useBookingForm";
import { useVehicleAvailability } from "@/hooks/useVehicleAvailability";
import { useBookingFormSubmit } from "@/hooks/useBookingFormSubmit";
import { useQuickClient } from "@/hooks/useQuickClient";
import {
  BookingFormHeader,
  ClientInformationCard,
  VehicleStatusCard,
  DatesPeriodCard,
  LocationsCard,
  ServicesCard,
  PricingCard,
  NotesConfirmationCard,
  QuickClientDialog,
  DriverLicenseDialog,
} from "./form";

const FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DRIVER_LICENSE_COOLDOWN_DAYS = 21;
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

interface BookingFormProps {
  users: BookingUserOption[];
  vehicles: BookingVehicleOption[];
  locations: BookingLocationOption[];
  services: BookingServiceOption[];
  mode?: "create" | "edit";
  booking?: BookingFormInitialValues;
}

export function BookingForm({
  users,
  vehicles,
  locations,
  services,
  mode = "create",
  booking,
}: BookingFormProps) {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);

  const bookingForm = useBookingForm({
    users,
    vehicles,
    services,
    mode,
    booking,
  });

  const availability = useVehicleAvailability({
    vehicleId: bookingForm.watchVehicleId || null,
    startDate: bookingForm.watchStartDate,
    endDate: bookingForm.watchEndDate,
    isEditMode: bookingForm.isEditMode,
    bookingId: booking?.id,
  });

  const submit = useBookingFormSubmit({
    form: bookingForm.form as unknown as import("react-hook-form").UseFormReturn<import("@/hooks/useBookingForm").BookingFormValues>,
    isEditMode: bookingForm.isEditMode,
    booking,
    availability: availability.availability,
    selectedUser: bookingForm.selectedUser,
  });

  const handleClientCreated = (client: BookingUserOption) => {
    bookingForm.setUserOptions((prev) =>
      [...prev, client].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      )
    );
    bookingForm.form.setValue("userId", client.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const quickClient = useQuickClient({
    onClientCreated: handleClientCreated,
  });

  const handleLicenseUploaded = ({
    url,
    publicId,
    uploadCount,
    lastUploadedAt,
  }: {
    url: string;
    publicId: string;
    uploadCount: number;
    lastUploadedAt: string;
  }) => {
    if (!bookingForm.selectedUser) return;

    bookingForm.setUserOptions((prev) =>
      prev.map((user) =>
        user.id === bookingForm.selectedUser!.id
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
    bookingForm.form.setValue("userId", bookingForm.selectedUser.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setIsLicenseDialogOpen(false);
  };

  const handleCreateClient = async (values: Parameters<typeof quickClient.createClient>[0]) => {
    const result = await quickClient.createClient(values);
    if (result) {
      setIsClientDialogOpen(false);
    }
    return result;
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
      <BookingFormHeader
        isEditMode={bookingForm.isEditMode}
        bookingReference={booking?.reference}
      />

      {submit.serverError && (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <AlertCircle className="h-5 w-5" />
            {submit.serverError}
          </CardContent>
        </Card>
      )}

      <FormProvider {...bookingForm.form}>
        <form onSubmit={bookingForm.form.handleSubmit(submit.handleSubmit as unknown as Parameters<typeof bookingForm.form.handleSubmit>[0])} className="space-y-6">
          <ClientInformationCard
            userOptions={bookingForm.userOptions}
            selectedUser={bookingForm.selectedUser}
            driverLicenseUploadInfo={bookingForm.driverLicenseUploadInfo}
            isPending={submit.isPending}
            isDriverLicenseUploadBlocked={bookingForm.isDriverLicenseUploadBlocked}
            maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
            dateFormatter={DATE_FORMATTER}
            onOpenLicenseDialog={() => setIsLicenseDialogOpen(true)}
            onOpenClientDialog={() => setIsClientDialogOpen(true)}
          />

          <VehicleStatusCard
            vehicles={vehicles}
            selectedVehicle={bookingForm.selectedVehicle}
            isEditMode={bookingForm.isEditMode}
            formatter={FORMATTER}
          />

          <DatesPeriodCard
            minDateTimeValue={bookingForm.minDateTimeValue}
            watchVehicleId={bookingForm.watchVehicleId}
            availability={availability.availability}
            isCheckingAvailability={availability.isCheckingAvailability}
          />

          <LocationsCard locations={locations} />

          <ServicesCard services={services} formatter={FORMATTER} />

          <PricingCard
            autoPricing={bookingForm.autoPricing}
            onAutoPricingChange={bookingForm.setAutoPricing}
            pricingInfo={bookingForm.pricingInfo}
            remainingAmount={bookingForm.remainingAmount}
            isPending={submit.isPending}
            formatter={FORMATTER}
          />

          <NotesConfirmationCard isEditMode={bookingForm.isEditMode} />

          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/bookings">Annuler</Link>
            </Button>
            <Button type="submit" disabled={submit.isSubmitDisabled}>
              {submit.isPending
                ? bookingForm.isEditMode
                  ? "Mise à jour en cours..."
                  : "Création en cours..."
                : bookingForm.isEditMode
                ? "Enregistrer les modifications"
                : "Créer la réservation"}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>

      <DriverLicenseDialog
        open={isLicenseDialogOpen}
        onOpenChange={setIsLicenseDialogOpen}
        selectedUser={bookingForm.selectedUser}
        driverLicenseUploadInfo={bookingForm.driverLicenseUploadInfo}
        maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
        cooldownDays={DRIVER_LICENSE_COOLDOWN_DAYS}
        onUploaded={handleLicenseUploaded}
      />

      <QuickClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        isCreatingClient={quickClient.isCreatingClient}
        serverError={quickClient.serverError}
        onCreateClient={handleCreateClient}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
