import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UpdateVehicleInput } from "@/lib/validations/vehicle";
import { updateVehicleAction } from "@/actions/admin/vehicles";

export function useVehicleFormSubmit() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (data: UpdateVehicleInput) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const result = await updateVehicleAction(data);

        if (!result.success) {
          setError(result.error || "Erreur lors de la mise à jour du véhicule");
          return;
        }

        setSuccess("Véhicule modifié avec succès !");
        setTimeout(() => {
          router.push("/admin/vehicles?success=vehicle-updated");
        }, 1500);
      } catch {
        setError("Une erreur est survenue lors de la mise à jour du véhicule");
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

