import { useCallback } from "react";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";
import { getFieldValidation, getSelectValidation } from "@/components/admin/vehicles/add/utils/validation-helpers";

interface UseVehicleFormValidationProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function useVehicleFormValidation({ form }: UseVehicleFormValidationProps) {
  const getFieldValidationHelper = useCallback(
    (fieldName: keyof CreateVehicleInput) => {
      return getFieldValidation(form, fieldName);
    },
    [form],
  );

  const getSelectValidationHelper = useCallback(
    (fieldName: keyof CreateVehicleInput) => {
      return getSelectValidation(form, fieldName);
    },
    [form],
  );

  return {
    getFieldValidation: getFieldValidationHelper,
    getSelectValidation: getSelectValidationHelper,
  };
}

