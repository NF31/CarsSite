import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";
import { createVehicleAction } from "@/actions/admin/vehicles";

export function useVehicleFormSubmit() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (data: CreateVehicleInput) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const result = await createVehicleAction(data);

        if (!result.success) {
          setError(result.error || "Erreur lors de la création du véhicule");
          return;
        }

        setSuccess("Véhicule créé avec succès !");
        setTimeout(() => {
          router.push("/admin/vehicles?success=vehicle-created");
        }, 1500);
      } catch {
        setError("Une erreur est survenue lors de la création du véhicule");
      } finally {
        setIsSubmitting(false);
      }
    },
    [router],
  );

  return {
    isSubmitting,
    error,
    success,
    onSubmit,
  };
}

