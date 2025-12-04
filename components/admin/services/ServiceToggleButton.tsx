"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toggleServiceActiveAction } from "@/actions/admin/services";
import type { ComponentProps } from "react";

interface ServiceToggleButtonProps {
  serviceId: string;
  serviceName: string;
  active: boolean;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  trigger?: (options: { onClick: () => void; isPending: boolean }) => ReactNode;
}

export function ServiceToggleButton({
  serviceId,
  serviceName,
  active,
  variant = "ghost",
  size = "sm",
  className,
  trigger,
}: ServiceToggleButtonProps) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleOpen = () => {
    if (!isPending) {
      setOpen(true);
    }
  };

  const handleConfirm = () => {
    startTransition(async () => {
      setErrorMessage(null);
      const result = await toggleServiceActiveAction(serviceId, !active);

      if (!result.success) {
        setErrorMessage(result.error ?? "Impossible de mettre à jour le statut du service.");
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("success", active ? "service-disabled" : "service-activated");

      const newQuery = params.toString();
      const url = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;

      setOpen(false);
      router.replace(url, { scroll: false });
    });
  };

  const triggerNode = trigger
    ? trigger({ onClick: handleOpen, isPending })
    : (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpen}
        disabled={isPending}
      >
        {active ? "Désactiver" : "Activer"}
      </Button>
    );

  return (
    <>
      {triggerNode}
      <AlertDialog open={open} onOpenChange={(value) => !isPending && setOpen(value)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {active ? "Désactiver le service ?" : "Activer le service ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {active
              ? `Ce service ne sera plus proposé aux clients lors des réservations.`
              : `Ce service sera de nouveau proposé aux clients lors des réservations.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">{serviceName}</p>
          {errorMessage && (
            <p className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Veuillez patienter..." : active ? "Désactiver" : "Activer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


