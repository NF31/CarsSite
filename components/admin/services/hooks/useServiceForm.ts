import { useMemo, useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createServiceSchema,
  type CreateServiceInput,
} from "@/lib/validations/service";
import type { SingleServiceRecord } from "@/actions/admin/services";

interface UseServiceFormProps {
  mode: "create" | "edit";
  service?: SingleServiceRecord;
}

export function useServiceForm({ mode, service }: UseServiceFormProps) {
  const isEditMode = mode === "edit" && !!service;
  const initialAllCategories = useMemo(
    () =>
      !service || (service.availableForCategories ?? []).length === 0,
    [service],
  );
  const [allCategories, setAllCategories] = useState(initialAllCategories);
  const [isActive, setIsActive] = useState<boolean>(service?.active ?? true);

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? undefined,
      price: service?.price ?? 10,
      pricingType: service?.pricingType ?? "PER_DAY",
      availableForCategories: service?.availableForCategories ?? [],
      icon: service?.icon ?? undefined,
    },
  });

  const pricingType =
    useWatch({
      control: form.control,
      name: "pricingType",
    }) ?? "PER_DAY";
  const selectedCategories =
    useWatch({
      control: form.control,
      name: "availableForCategories",
      defaultValue: [],
    }) ?? [];

  useEffect(() => {
    if (allCategories) {
      form.setValue("availableForCategories", []);
    }
  }, [allCategories, form]);

  useEffect(() => {
    if (!allCategories && selectedCategories.length === 0) {
      form.setError("availableForCategories", {
        type: "manual",
        message: "Sélectionnez au moins une catégorie ou activez toutes les catégories.",
      });
    } else {
      form.clearErrors("availableForCategories");
    }
  }, [allCategories, selectedCategories.length, form]);

  return {
    form,
    isEditMode,
    allCategories,
    setAllCategories,
    isActive,
    setIsActive,
    pricingType,
    selectedCategories,
  };
}

