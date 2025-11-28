"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle";
import { BasicInfoSection } from "@/components/admin/vehicles/add/sections/BasicInfoSection";
import { CharacteristicsSection } from "@/components/admin/vehicles/add/sections/CharacteristicsSection";
import { FeaturesSection } from "@/components/admin/vehicles/add/sections/FeaturesSection";
import { PricingSection } from "@/components/admin/vehicles/add/sections/PricingSection";
import { LocationSection } from "@/components/admin/vehicles/add/sections/LocationSection";
import { DescriptionSection } from "@/components/admin/vehicles/add/sections/DescriptionSection";
import { FormActions } from "@/components/admin/vehicles/add/sections/FormActions";
import {
  categoryOptions,
  transmissionOptions,
  fuelTypeOptions,
  locationOptions,
  availableFeatures,
  yearOptions,
} from "./utils";
import { useVehicleImages } from "./hooks/useVehicleImages";
import { useVehicleFormSubmit } from "./hooks/useVehicleFormSubmit";
import { useVehicleFormValidation } from "./hooks/useVehicleFormValidation";
import {
  VehicleFormHeader,
  ErrorBanner,
  SuccessBanner,
  VehicleImagesSection,
} from "./components";

interface VehicleFormProps {
  locations: Array<{ id: string; name: string; city: string }>;
}

export function VehicleForm({}: VehicleFormProps) {
  const form = useForm<CreateVehicleInput>({
    // @ts-expect-error - Type incompatibility between zodResolver and useForm
    resolver: zodResolver(createVehicleSchema),
    mode: "onChange",
    defaultValues: {
      features: [],
      images: [],
      imagePublicIds: [],
      pricePerWeek: undefined,
      pricePerMonth: undefined,
      description: "",
      locationId: locationOptions[0]?.value || "",
    },
  });

  const { watch, setValue, trigger, formState: { isValid, isDirty, errors } } = form;
  const locationIdValue = watch("locationId");

  const { images, handleImagesChange, imagesCount } = useVehicleImages({
    setValue,
    trigger,
  });

  const { isSubmitting, error, success, onSubmit } = useVehicleFormSubmit();

  const { getFieldValidation, getSelectValidation } = useVehicleFormValidation({ form });

  // Définir locationId au chargement avec la valeur par défaut (Paris)
  useEffect(() => {
    if (locationOptions[0]?.value && (!locationIdValue || locationIdValue === "")) {
      setValue("locationId", locationOptions[0].value, {
        shouldValidate: true,
        shouldDirty: false,
      });
      trigger("locationId");
    }
  }, [locationIdValue, setValue, trigger]);

  return (
    <div className="space-y-6">
      <VehicleFormHeader />

      {error && <ErrorBanner message={error} />}

      {success && <SuccessBanner message={success} />}

      <form
        // @ts-expect-error - Type incompatibility with react-hook-form generic types
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <BasicInfoSection
          form={form as any}
          getFieldValidation={getFieldValidation}
          getSelectValidation={getSelectValidation}
          yearOptions={yearOptions}
        />

        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <CharacteristicsSection
          form={form as any}
          getFieldValidation={getFieldValidation}
          getSelectValidation={getSelectValidation}
          categoryOptions={categoryOptions}
          transmissionOptions={transmissionOptions}
          fuelTypeOptions={fuelTypeOptions}
        />

        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <FeaturesSection form={form as any} availableFeatures={availableFeatures} />

        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <PricingSection form={form as any} getFieldValidation={getFieldValidation} />

        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <LocationSection
          form={form as any}
          getSelectValidation={getSelectValidation}
          locationOptions={locationOptions}
        />

        <VehicleImagesSection
          images={images}
          onImagesChange={handleImagesChange}
          errors={errors}
          watch={watch}
        />

        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <DescriptionSection form={form as any} getFieldValidation={getFieldValidation} />

        {/* Type incompatibility with react-hook-form generic types */}
        {/* @ts-ignore */}
        <FormActions
          form={form as any}
          isSubmitting={isSubmitting}
          imagesCount={imagesCount}
          isValid={isValid}
          isDirty={isDirty}
        />
      </form>
    </div>
  );
}
