"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateClientAction } from "@/actions/admin/clients/update-client";
import type { ClientDetail } from "@/actions/admin/clients/get-client";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { DriverLicenseUpload } from "@/components/admin/bookings/DriverLicenseUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClientEditFormHeader,
  ClientContactInfoCard,
  ClientStatusCard,
  ClientActivityCard,
  ClientDriverLicenseCard,
  ServerErrorAlert,
} from "@/components/admin/clients/edit";
import { useClientEditForm, type FormValues } from "@/hooks/useClientEditForm";
import { useDriverLicenseEdit } from "@/hooks/useDriverLicenseEdit";
import { CLIENT_STATUS_ICONS, CLIENT_STATUS_LABELS } from "@/components/admin/clients/client-helpers";

const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DRIVER_LICENSE_COOLDOWN_DAYS = 21;

const statusOptions: { value: "active" | "inactive" | "locked"; label: string }[] = [
  { value: "active", label: CLIENT_STATUS_LABELS.ACTIVE },
  { value: "inactive", label: CLIENT_STATUS_LABELS.INACTIVE },
  { value: "locked", label: CLIENT_STATUS_LABELS.LOCKED },
];

interface ClientEditFormProps {
  client: ClientDetail;
}

export function ClientEditForm({ client }: ClientEditFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);
  const [clientData, setClientData] = useState(client);
  const canCreateReservation = !client.deletedAt && client.status === "ACTIVE";

  const StatusIcon = CLIENT_STATUS_ICONS[client.status];

  const {
    form,
    selectedStatus,
    lockedUntilValue,
    accountAge,
    lastUpdate,
    lastActivity,
    isCurrentlyLocked,
    totalAmountFormatted,
    averageAmountFormatted,
  } = useClientEditForm(client);

  const {
    licenseError,
    isLicensePending,
    driverLicenseUploadInfo,
    isDriverLicenseUploadBlocked,
    handleViewDriverLicense,
  } = useDriverLicenseEdit(clientData);

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
          ? new Date(values.lockedUntil)
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

  return (
    <div className="space-y-6">
      <ClientEditFormHeader
        client={client}
        StatusIcon={StatusIcon}
        canCreateReservation={canCreateReservation}
        accountAge={accountAge}
        lastUpdate={lastUpdate}
      />

      {serverError && (
        <ServerErrorAlert error={serverError} onDismiss={() => setServerError(null)} />
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <ClientContactInfoCard form={form} />

            <ClientStatusCard
              form={form}
              selectedStatus={selectedStatus}
              lockedUntilValue={lockedUntilValue}
              isCurrentlyLocked={isCurrentlyLocked}
              client={client}
              statusOptions={statusOptions}
            />
          </div>

          <ClientActivityCard
            client={client}
            lastActivity={lastActivity}
            totalAmountFormatted={totalAmountFormatted}
            averageAmountFormatted={averageAmountFormatted}
          />

          <ClientDriverLicenseCard
            clientData={clientData}
            driverLicenseUploadInfo={driverLicenseUploadInfo}
            isLicensePending={isLicensePending}
            licenseError={licenseError}
            isDriverLicenseUploadBlocked={isDriverLicenseUploadBlocked}
            onViewLicense={handleViewDriverLicense}
            onOpenUploadDialog={() => setIsLicenseDialogOpen(true)}
          />

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

      <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {clientData.hasDriverLicense ? "Remplacer le permis de conduire" : "Ajouter un permis de conduire"}
            </DialogTitle>
            <DialogDescription>
              Téléversez un PDF sécurisé du permis de conduire. Le document est stocké dans un dossier privé.
            </DialogDescription>
          </DialogHeader>
          <DriverLicenseUpload
            userId={clientData.id}
            userName={clientData.name}
            existingUrl={clientData.hasDriverLicense ? clientData.driverLicenseUrl : null}
            uploadCount={driverLicenseUploadInfo?.normalizedCount ?? 0}
            lastUploadedAt={
              driverLicenseUploadInfo?.lastWithinWindow
                ? driverLicenseUploadInfo.lastWithinWindow.toISOString()
                : null
            }
            maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
            cooldownDays={DRIVER_LICENSE_COOLDOWN_DAYS}
            onUploaded={({ url, publicId, uploadCount, lastUploadedAt }) => {
              // Mettre à jour les données du client localement (pas besoin de recharger la page)
              setClientData((prev) => ({
                ...prev,
                hasDriverLicense: true,
                driverLicenseUrl: url,
                driverLicensePublicId: publicId,
                driverLicenseUploadCount: uploadCount,
                driverLicenseLastUploadedAt: lastUploadedAt,
              }));
              setIsLicenseDialogOpen(false);
            }}
            onDismiss={() => setIsLicenseDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}


