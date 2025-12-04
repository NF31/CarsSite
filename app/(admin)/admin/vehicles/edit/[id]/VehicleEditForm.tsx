"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateVehicleSchema, type UpdateVehicleInput } from "@/lib/validations/vehicle";
import type { TransmissionType, FuelType } from "@prisma/client";
import type { VehicleCategory } from "@/lib/types/vehicle-category";
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
  availableFeatures,
  yearOptions,
} from "./utils";
import { useVehicleImages } from "./hooks/useVehicleImages";
import { useVehicleFormSubmit } from "./hooks/useVehicleFormSubmit";
import { useVehicleFormValidation } from "./hooks/useVehicleFormValidation";
import {
  VehicleEditFormHeader,
  ErrorBanner,
  SuccessBanner,
  VehicleImagesSection,
} from "./components";

interface VehicleEditFormProps {
  locations: Array<{ id: string; name: string; city: string }>;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    mileage: number;
    category: string;
    seats: number;
    transmission: string;
    fuelType: string;
    color: string;
    pricePerDay: number;
    pricePerWeek: number | null;
    pricePerMonth: number | null;
    deposit: number;
    status: string;
    locationId: string;
    features: string[];
    images: string[];
    imagePublicIds?: string[];
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function VehicleEditForm({ vehicle, locations }: VehicleEditFormProps) {
  // Construire les options de localisation à partir des locations reçues
  const locationOptions = useMemo(
    () =>
      locations.map((loc) => ({
        value: loc.id,
        label: `${loc.name} - ${loc.city}`,
      })),
    [locations],
  );

  // Initialiser les images avec la première image comme principale
  const initialImages = useMemo(
    () =>
      vehicle.images.map((url, index) => ({
        url,
        publicId: vehicle.imagePublicIds?.[index] || undefined,
        isMain: index === 0,
      })),
    [vehicle.images, vehicle.imagePublicIds],
  );

  const form = useForm<UpdateVehicleInput>({
    // @ts-expect-error - Type incompatibility between zodResolver and useForm
    resolver: zodResolver(updateVehicleSchema),
    mode: "onChange",
    defaultValues: {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      mileage: vehicle.mileage,
      category: vehicle.category as VehicleCategory,
      seats: vehicle.seats,
      transmission: vehicle.transmission as TransmissionType,
      fuelType: vehicle.fuelType as FuelType,
      color: vehicle.color,
      pricePerDay: vehicle.pricePerDay,
      pricePerWeek: vehicle.pricePerWeek ?? undefined,
      pricePerMonth: vehicle.pricePerMonth ?? undefined,
      deposit: vehicle.deposit,
      locationId: vehicle.locationId,
      features: vehicle.features || [],
      images: vehicle.images || [],
      imagePublicIds: vehicle.imagePublicIds || [],
      description: vehicle.description || "",
    },
  });

  const { watch, setValue, trigger, formState: { isValid, isDirty, errors } } = form;
  const locationIdValue = watch("locationId");

  const { images, handleImagesChange, imagesCount } = useVehicleImages({
    initialImages,
    setValue,
    trigger,
  });

  const { isSubmitting, error, success, onSubmit } = useVehicleFormSubmit();

  const { getFieldValidation, getSelectValidation } = useVehicleFormValidation({ form });

  // Définir locationId au chargement avec la valeur du véhicule
  useEffect(() => {
    if (vehicle.locationId && (!locationIdValue || locationIdValue === "")) {
      setValue("locationId", vehicle.locationId, {
        shouldValidate: true,
        shouldDirty: false,
      });
      trigger("locationId");
    }
  }, [locationIdValue, setValue, trigger, vehicle.locationId]);

  return (
    <div className="space-y-6">
      <VehicleEditFormHeader
        brand={vehicle.brand}
        model={vehicle.model}
        licensePlate={vehicle.licensePlate}
      />

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
          isEditMode={true}
        />
      </form>
    </div>
  );
}

