"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle";
import { createVehicleAction } from "@/actions/admin/vehicles";
import type { VehicleCategory, TransmissionType, FuelType } from "@prisma/client";
import { ImageUpload } from "@/components/admin/vehicles/add/ImageUpload";
import { BasicInfoSection } from "@/components/admin/vehicles/add/sections/BasicInfoSection";
import { CharacteristicsSection } from "@/components/admin/vehicles/add/sections/CharacteristicsSection";
import { FeaturesSection } from "@/components/admin/vehicles/add/sections/FeaturesSection";
import { PricingSection } from "@/components/admin/vehicles/add/sections/PricingSection";
import { LocationSection } from "@/components/admin/vehicles/add/sections/LocationSection";
import { DescriptionSection } from "@/components/admin/vehicles/add/sections/DescriptionSection";
import { FormActions } from "@/components/admin/vehicles/add/sections/FormActions";
import { getFieldValidation, getSelectValidation } from "@/components/admin/vehicles/add/utils/validation-helpers";

interface VehicleFormProps {
  locations: Array<{ id: string; name: string; city: string }>;
}

const categoryOptions: { value: VehicleCategory; label: string }[] = [
  { value: "ECONOMY", label: "Économique" },
  { value: "COMPACT", label: "Compact" },
  { value: "MID_SIZE", label: "Moyenne" },
  { value: "FULL_SIZE", label: "Grande" },
  { value: "SUV", label: "SUV" },
  { value: "LUXURY", label: "Luxe" },
  { value: "VAN", label: "Utilitaire" },
];

const transmissionOptions: { value: TransmissionType; label: string }[] = [
  { value: "MANUAL", label: "Manuelle" },
  { value: "AUTOMATIC", label: "Automatique" },
];

const fuelTypeOptions: { value: FuelType; label: string }[] = [
  { value: "PETROL", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Électrique" },
  { value: "HYBRID", label: "Hybride" },
];

const locationOptions: { value: string; label: string }[] = [
  { value: "PARIS", label: "Paris" },
];

const availableFeatures = [
  "GPS",
  "Bluetooth",
  "Climatisation",
  "Caméra de recul",
  "Aide au stationnement",
  "Toit ouvrant",
  "Sièges chauffants",
  "Volant cuir",
  "Système audio premium",
  "Wi-Fi",
  "Chargeur sans fil",
  "Détecteur d'angle mort",
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

export function VehicleForm({}: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ url: string; publicId?: string; isMain?: boolean }>>([]);

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
  const imagesCount = images.length;
  const locationIdValue = watch("locationId");

  // Définir locationId au chargement avec la valeur par défaut (Paris)
  useEffect(() => {
    if (locationOptions[0]?.value && (!locationIdValue || locationIdValue === "")) {
      setValue("locationId", locationOptions[0].value, { 
        shouldValidate: true, 
        shouldDirty: false
      });
      trigger("locationId");
    }
  }, [locationIdValue, setValue, trigger]);

  const handleImagesChange = (newImages: Array<{ url: string; publicId?: string; isMain?: boolean }>) => {
    setImages(newImages);
    const sortedImages = [...newImages].sort((a, b) => {
      if (a.isMain) return -1;
      if (b.isMain) return 1;
      return 0;
    });
    const imageUrls = sortedImages.map((img) => img.url);
    const imagePublicIds = sortedImages.map((img) => img.publicId || "").filter((id) => id !== "");
    setValue("images", imageUrls, { shouldValidate: true, shouldDirty: true });
    setValue("imagePublicIds", imagePublicIds, { shouldValidate: true, shouldDirty: true });
    trigger("images");
    trigger("imagePublicIds");
  };

  const onSubmit = async (data: CreateVehicleInput) => {
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
  };

  // Helpers de validation avec le form
  const getFieldValidationHelper = (fieldName: keyof CreateVehicleInput) => {
    // @ts-expect-error - Type incompatibility with react-hook-form generic types
    return getFieldValidation(form, fieldName);
  };
  
  const getSelectValidationHelper = (fieldName: keyof CreateVehicleInput) => {
    // @ts-expect-error - Type incompatibility with react-hook-form generic types
    return getSelectValidation(form, fieldName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/vehicles">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer un véhicule</h1>
          <p className="text-muted-foreground">Remplissez le formulaire pour ajouter un nouveau véhicule à la flotte</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      <form 
        // @ts-expect-error - Type incompatibility with react-hook-form generic types
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
        <BasicInfoSection
          form={form as any}
          getFieldValidation={getFieldValidationHelper}
          getSelectValidation={getSelectValidationHelper}
          yearOptions={yearOptions}
        />

        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
        <CharacteristicsSection
          form={form as any}
          getFieldValidation={getFieldValidationHelper}
          getSelectValidation={getSelectValidationHelper}
          categoryOptions={categoryOptions}
          transmissionOptions={transmissionOptions}
          fuelTypeOptions={fuelTypeOptions}
        />

        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
        <FeaturesSection
          form={form as any}
          availableFeatures={availableFeatures}
        />

        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
        <PricingSection
          form={form as any}
          getFieldValidation={getFieldValidationHelper}
        />

        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
        <LocationSection
          form={form as any}
          getSelectValidation={getSelectValidationHelper}
          locationOptions={locationOptions}
        />

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Ajoutez au moins 5 photos du véhicule. Définissez une image principale qui sera affichée en premier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={images}
              onImagesChange={handleImagesChange}
              error={errors.images?.message}
              minImages={5}
              maxImages={20}
              brand={watch("brand")}
              model={watch("model")}
            />
          </CardContent>
        </Card>

        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
        <DescriptionSection
          form={form as any}
          getFieldValidation={getFieldValidationHelper}
        />

        {/* @ts-ignore - Type incompatibility with react-hook-form generic types */}
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
