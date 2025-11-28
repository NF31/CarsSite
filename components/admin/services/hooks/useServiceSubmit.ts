import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import {
  createServiceAction,
  updateServiceAction,
  type SingleServiceRecord,
} from "@/actions/admin/services";
import type { CreateServiceInput } from "@/lib/validations/service";

interface UseServiceSubmitProps {
  form: UseFormReturn<CreateServiceInput>;
  isEditMode: boolean;
  service?: SingleServiceRecord;
  allCategories: boolean;
  isActive: boolean;
}

export function useServiceSubmit({
  form,
  isEditMode,
  service,
  allCategories,
  isActive,
}: UseServiceSubmitProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setSuccessMessage(null);

    const payload: CreateServiceInput = {
      ...values,
      description: values.description?.trim() || undefined,
      icon: values.icon?.trim() || undefined,
      availableForCategories: allCategories ? [] : values.availableForCategories,
    };

    startTransition(async () => {
      if (isEditMode && service) {
        const result = await updateServiceAction(service.id, {
          ...payload,
          active: isActive,
        });

        if (result.success && result.data) {
          setSuccessMessage(`Service "${result.data.name}" mis à jour avec succès.`);
          setTimeout(() => {
            router.push("/admin/services?success=service-updated");
          }, 1000);
          return;
        }

        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (!messages) return;
            form.setError(field as keyof CreateServiceInput, {
              type: "server",
              message: messages[0],
            });
          });
        }

        if (result.error) {
          setServerError(result.error);
        }

        return;
      }

      const result = await createServiceAction(payload);

      if (result.success && result.data) {
        setSuccessMessage(`Service "${result.data.name}" créé avec succès.`);
        form.reset({
          name: "",
          description: undefined,
          price: 10,
          pricingType: "PER_DAY",
          availableForCategories: [],
          icon: undefined,
        });
        setTimeout(() => {
          router.push("/admin/services?success=service-created");
        }, 1000);
        return;
      }

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages) return;
          form.setError(field as keyof CreateServiceInput, {
            type: "server",
            message: messages[0],
          });
        });
      }

      if (result.error) {
        setServerError(result.error);
      }
    });
  });

  return {
    onSubmit,
    serverError,
    setServerError,
    successMessage,
    isPending,
  };
}

