"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validations/vehicle";
import { createVehicleAction } from "@/actions/admin/vehicles";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import type { VehicleCategory, TransmissionType, FuelType } from "@prisma/client";
import { ImageUpload } from "@/components/admin/vehicles/add/ImageUpload";

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

export function VehicleForm({ locations }: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ url: string; isMain?: boolean }>>([]);

  // Trouver l'ID de Paris ou utiliser le premier
  const parisLocationId = locations.find(l => l.city.toLowerCase().includes("paris"))?.id || locations[0]?.id || "";
  
  // DEBUG: Log pour voir les locations reçues
  useEffect(() => {
    console.log("📍 DEBUG Locations:", {
      locations: locations,
      locationsCount: locations.length,
      parisLocation: locations.find(l => l.city.toLowerCase().includes("paris")),
      firstLocation: locations[0],
      parisLocationId: parisLocationId,
    });
  }, [locations, parisLocationId]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields },
    setValue,
    watch,
    trigger,
  } = useForm<CreateVehicleInput>({
    // @ts-expect-error - Type incompatibility between zodResolver and useForm
    resolver: zodResolver(createVehicleSchema),
    mode: "onChange", // Validation en temps réel
    defaultValues: {
      features: [],
      images: [],
      pricePerWeek: undefined,
      pricePerMonth: undefined,
      description: "",
      locationId: locationOptions[0]?.value || "",
    },
  });

  const selectedFeatures = watch("features") || [];

  // Observer la valeur de locationId pour l'affichage (valeur par défaut = Paris)
  const locationIdValue = watch("locationId");
  
  // Observer isValid et les images pour forcer le re-render du bouton
  const formIsValid = isValid;
  const imagesCount = images.length;
  
  // Observer toutes les valeurs du formulaire pour les logs
  const brand = watch("brand");
  const model = watch("model");
  const year = watch("year");
  const licensePlate = watch("licensePlate");
  const mileage = watch("mileage");
  const category = watch("category");
  const seats = watch("seats");
  const transmission = watch("transmission");
  const fuelType = watch("fuelType");
  const color = watch("color");
  const features = watch("features");
  const pricePerDay = watch("pricePerDay");
  const pricePerWeek = watch("pricePerWeek");
  const pricePerMonth = watch("pricePerMonth");
  const deposit = watch("deposit");
  const description = watch("description");
  const formImages = watch("images");

  // DEBUG: Logs pour comprendre l'état du formulaire avec TOUTES les valeurs
  useEffect(() => {
    console.log("🔍 DEBUG FORMULAIRE COMPLET - TOUTES LES INFOS:");
    console.log("==========================================");
    console.log("📋 INFORMATIONS DE BASE:");
    console.log("  - Marque:", brand || "(vide)");
    console.log("  - Modèle:", model || "(vide)");
    console.log("  - Année:", year || "(vide)");
    console.log("  - Plaque:", licensePlate || "(vide)");
    console.log("  - Kilométrage:", mileage || "(vide)");
    console.log("");
    console.log("🚗 CARACTÉRISTIQUES:");
    console.log("  - Catégorie:", category || "(vide)");
    console.log("  - Places:", seats || "(vide)");
    console.log("  - Transmission:", transmission || "(vide)");
    console.log("  - Carburant:", fuelType || "(vide)");
    console.log("  - Couleur:", color || "(vide)");
    console.log("");
    console.log("⚙️ ÉQUIPEMENTS:");
    console.log("  - Équipements:", features || []);
    console.log("  - Nombre:", features?.length || 0);
    console.log("");
    console.log("💰 TARIFICATION:");
    console.log("  - Prix/jour:", pricePerDay || "(vide)", "€");
    console.log("  - Prix/semaine:", pricePerWeek || "(vide)", "€");
    console.log("  - Prix/mois:", pricePerMonth || "(vide)", "€");
    console.log("  - Dépôt:", deposit || "(vide)", "€");
    console.log("");
    console.log("📍 LOCALISATION:");
    console.log("  - Agence ID:", locationIdValue || "(vide)");
    console.log("");
    console.log("🖼️ PHOTOS:");
    console.log("  - Nombre d'images:", images.length);
    console.log("  - Images dans le formulaire:", formImages || []);
    console.log("  - URLs complètes:", images);
    console.log("");
    console.log("📝 DESCRIPTION:");
    console.log("  - Description:", description || "(vide)");
    console.log("  - Longueur:", description?.length || 0, "caractères");
    console.log("");
    console.log("✅ ÉTAT DU FORMULAIRE:");
    console.log("  - Formulaire valide:", formIsValid);
    console.log("  - Nombre d'images:", imagesCount);
    console.log("  - Erreurs:", Object.keys(errors));
    console.log("  - Nombre d'erreurs:", Object.keys(errors).length);
    console.log("  - Champs touchés:", Object.keys(touchedFields));
    console.log("  - Formulaire modifié:", isDirty);
    console.log("  - Bouton devrait être vert:", formIsValid && imagesCount >= 5 && !isSubmitting);
    console.log("");
    console.log("📦 OBJET COMPLET DES VALEURS:");
    console.log({
      brand,
      model,
      year,
      licensePlate,
      mileage,
      category,
      seats,
      transmission,
      fuelType,
      color,
      features,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      deposit,
      locationId: locationIdValue,
      images: formImages,
      description,
    });
    console.log("==========================================");
  }, [brand, model, year, licensePlate, mileage, category, seats, transmission, fuelType, color, features, pricePerDay, pricePerWeek, pricePerMonth, deposit, locationIdValue, images, formImages, description, formIsValid, imagesCount, errors, touchedFields, isDirty, isSubmitting]);
  
  // Définir locationId au chargement avec la valeur par défaut (Paris)
  useEffect(() => {
    if (locationOptions[0]?.value && (!locationIdValue || locationIdValue === "")) {
      console.log("🔧 DEBUG: Définition de locationId à", locationOptions[0].value);
      setValue("locationId", locationOptions[0].value, { 
        shouldValidate: true, 
        shouldDirty: false // Ne pas marquer comme dirty car c'est la valeur par défaut
      });
      trigger("locationId");
    }
  }, [locationIdValue, setValue, trigger]);

  // Helper pour obtenir la classe CSS et l'icône de validation pour les Input
  const getFieldValidation = (fieldName: keyof CreateVehicleInput) => {
    const isTouched = touchedFields[fieldName];
    const hasError = errors[fieldName];
    const hasValue = watch(fieldName);

    if (!isTouched && !hasValue) {
      return { className: "", icon: null };
    }

    if (hasError) {
      return {
        className: "border-red-500 focus-visible:ring-red-500",
        icon: <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />,
      };
    }

    if (isTouched && !hasError && hasValue) {
      return {
        className: "border-green-500 focus-visible:ring-green-500",
        icon: <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />,
      };
    }

    return { className: "", icon: null };
  };

  // Helper pour obtenir la classe CSS et l'icône de validation pour les Select
  const getSelectValidation = (fieldName: keyof CreateVehicleInput) => {
    const hasError = errors[fieldName];
    const fieldValue = watch(fieldName);
    // Pour les Select, vérifier si la valeur existe (pas undefined, null, ou string vide)
    const hasValue = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

    if (hasError) {
      return {
        className: "border-red-500 focus:ring-red-500",
        icon: <XCircle className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none" />,
      };
    }

    // Afficher le vert si le champ a une valeur et pas d'erreur (même si pas touché, car Select = choix explicite)
    if (!hasError && hasValue) {
      return {
        className: "border-green-500 focus:ring-green-500",
        icon: <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500 pointer-events-none" />,
      };
    }

    return { className: "", icon: null };
  };

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = selectedFeatures;
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];
    setValue("features", newFeatures, { shouldValidate: true, shouldDirty: true });
    trigger("features");
  };

  const handleImagesChange = (newImages: Array<{ url: string; isMain?: boolean }>) => {
    setImages(newImages);
    // Convertir en tableau simple avec l'image principale en premier
    const imageUrls = [...newImages]
      .sort((a, b) => {
        // L'image principale doit être en premier
        if (a.isMain) return -1;
        if (b.isMain) return 1;
        return 0;
      })
      .map((img) => img.url);
    console.log("🖼️ DEBUG Images changées:", {
      imagesCount: newImages.length,
      imageUrlsCount: imageUrls.length,
      imageUrls: imageUrls,
    });
    setValue("images", imageUrls, { shouldValidate: true, shouldDirty: true });
    trigger("images");
  };

  const onSubmit = async (data: CreateVehicleInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // LOG COMPLET DE TOUTES LES DONNÉES DU FORMULAIRE
    console.log("📋 DEBUG FORMULAIRE COMPLET:", {
      brand: data.brand,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      mileage: data.mileage,
      category: data.category,
      seats: data.seats,
      transmission: data.transmission,
      fuelType: data.fuelType,
      color: data.color,
      pricePerDay: data.pricePerDay,
      pricePerWeek: data.pricePerWeek,
      pricePerMonth: data.pricePerMonth,
      deposit: data.deposit,
      locationId: data.locationId,
      features: data.features,
      images: data.images,
      imagesCount: data.images?.length,
      description: data.description,
      allData: data,
    });

    try {
      const result = await createVehicleAction(data);

      if (!result.success) {
        // Afficher les erreurs de champs spécifiques
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              setValue(field as keyof CreateVehicleInput, "" as unknown as CreateVehicleInput[keyof CreateVehicleInput], {
                shouldValidate: true,
              });
            }
          });
          // Déclencher la validation pour afficher les erreurs
          await trigger();
        }
        setError(result.error || "Erreur lors de la création du véhicule");
        return;
      }

      setSuccess("Véhicule créé avec succès !");
      
      // Rediriger vers la liste des véhicules avec un message de succès après 1.5 secondes
      setTimeout(() => {
        router.push("/admin/vehicles?success=vehicle-created");
      }, 1500);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/vehicles">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajouter un véhicule</h1>
          <p className="text-gray-600 mt-1">Remplissez le formulaire pour créer un nouveau véhicule</p>
        </div>
      </div>

      {/* Messages d'erreur/succès */}
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
        // @ts-expect-error - Type incompatibility with handleSubmit
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {/* Informations de Base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de Base</CardTitle>
            <CardDescription>Informations principales du véhicule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Marque *</Label>
                <div className="relative">
                  <Input
                    id="brand"
                    placeholder="Peugeot"
                    {...register("brand", { required: "La marque est requise" })}
                    className={getFieldValidation("brand").className}
                  />
                  {getFieldValidation("brand").icon}
                </div>
                {errors.brand && (
                  <p className="text-sm text-red-500">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <div className="relative">
                  <Input
                    id="model"
                    placeholder="208"
                    {...register("model", { required: "Le modèle est requis" })}
                    className={getFieldValidation("model").className}
                  />
                  {getFieldValidation("model").icon}
                </div>
                {errors.model && (
                  <p className="text-sm text-red-500">{errors.model.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année *</Label>
                <div className="relative">
                  <Select
                    onValueChange={(value) => {
                      setValue("year", parseInt(value), { shouldValidate: true, shouldDirty: true });
                      trigger("year");
                    }}
                  >
                    <SelectTrigger 
                      id="year" 
                      className={getSelectValidation("year").className}
                    >
                      <SelectValue placeholder="Sélectionner une année" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectValidation("year").icon}
                </div>
                {errors.year && (
                  <p className="text-sm text-red-500">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">Plaque d&apos;immatriculation *</Label>
                <div className="relative">
                  <Input
                    id="licensePlate"
                    placeholder="AB-123-CD"
                    {...register("licensePlate", { required: "La plaque d'immatriculation est requise" })}
                    className={getFieldValidation("licensePlate").className}
                  />
                  {getFieldValidation("licensePlate").icon}
                </div>
                {errors.licensePlate && (
                  <p className="text-sm text-red-500">{errors.licensePlate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Kilométrage *</Label>
                <div className="relative">
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="12000"
                    {...register("mileage", { 
                      valueAsNumber: true,
                      required: "Le kilométrage est requis",
                      min: { value: 0, message: "Le kilométrage ne peut pas être négatif" }
                    })}
                    className={getFieldValidation("mileage").className}
                  />
                  {getFieldValidation("mileage").icon}
                </div>
                {errors.mileage && (
                  <p className="text-sm text-red-500">{errors.mileage.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
            <CardDescription>Caractéristiques techniques du véhicule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <div className="relative">
                  <Select
                    onValueChange={(value) => {
                      setValue("category", value as VehicleCategory, { shouldValidate: true, shouldDirty: true });
                      trigger("category");
                    }}
                  >
                    <SelectTrigger id="category" className={getSelectValidation("category").className}>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectValidation("category").icon}
                </div>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Nombre de places *</Label>
                <div className="relative">
                  <Input
                    id="seats"
                    type="number"
                    placeholder="5"
                    {...register("seats", { 
                      valueAsNumber: true,
                      required: "Le nombre de places est requis",
                      min: { value: 2, message: "Le véhicule doit avoir au moins 2 places" },
                      max: { value: 9, message: "Le véhicule ne peut pas avoir plus de 9 places" }
                    })}
                    className={getFieldValidation("seats").className}
                  />
                  {getFieldValidation("seats").icon}
                </div>
                {errors.seats && (
                  <p className="text-sm text-red-500">{errors.seats.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission *</Label>
                <div className="relative">
                  <Select
                    onValueChange={(value) => {
                      setValue("transmission", value as TransmissionType, { shouldValidate: true, shouldDirty: true });
                      trigger("transmission");
                    }}
                  >
                    <SelectTrigger id="transmission" className={getSelectValidation("transmission").className}>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {transmissionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectValidation("transmission").icon}
                </div>
                {errors.transmission && (
                  <p className="text-sm text-red-500">{errors.transmission.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Carburant *</Label>
                <div className="relative">
                  <Select
                    onValueChange={(value) => {
                      setValue("fuelType", value as FuelType, { shouldValidate: true, shouldDirty: true });
                      trigger("fuelType");
                    }}
                  >
                    <SelectTrigger id="fuelType" className={getSelectValidation("fuelType").className}>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectValidation("fuelType").icon}
                </div>
                {errors.fuelType && (
                  <p className="text-sm text-red-500">{errors.fuelType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur *</Label>
                <div className="relative">
                  <Input
                    id="color"
                    placeholder="Blanc"
                    {...register("color", { required: "La couleur est requise" })}
                    className={getFieldValidation("color").className}
                  />
                  {getFieldValidation("color").icon}
                </div>
                {errors.color && (
                  <p className="text-sm text-red-500">{errors.color.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Équipements */}
        <Card>
          <CardHeader>
            <CardTitle>Équipements</CardTitle>
            <CardDescription>Sélectionnez les équipements disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableFeatures.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <Label
                      htmlFor={`feature-${feature}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedFeatures.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{selectedFeatures.length} équipement{selectedFeatures.length > 1 ? "s" : ""} sélectionné{selectedFeatures.length > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarification */}
        <Card>
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
            <CardDescription>Définissez les prix de location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerDay">Prix/jour (€) *</Label>
                <div className="relative">
                  <Input
                    id="pricePerDay"
                    type="number"
                    step="0.01"
                    placeholder="45.00"
                    {...register("pricePerDay", { 
                      valueAsNumber: true,
                      required: "Le prix par jour est requis",
                      min: { value: 0.01, message: "Le prix par jour doit être supérieur à 0" }
                    })}
                    className={getFieldValidation("pricePerDay").className}
                  />
                  {getFieldValidation("pricePerDay").icon}
                </div>
                {errors.pricePerDay && (
                  <p className="text-sm text-red-500">{errors.pricePerDay.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerWeek">Prix/semaine (€)</Label>
                <div className="relative">
                  <Input
                    id="pricePerWeek"
                    type="number"
                    step="0.01"
                    placeholder="280.00"
                    {...register("pricePerWeek", { valueAsNumber: true })}
                    className={getFieldValidation("pricePerWeek").className}
                  />
                  {getFieldValidation("pricePerWeek").icon}
                </div>
                {errors.pricePerWeek && (
                  <p className="text-sm text-red-500">{errors.pricePerWeek.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerMonth">Prix/mois (€)</Label>
                <div className="relative">
                  <Input
                    id="pricePerMonth"
                    type="number"
                    step="0.01"
                    placeholder="1200.00"
                    {...register("pricePerMonth", { valueAsNumber: true })}
                    className={getFieldValidation("pricePerMonth").className}
                  />
                  {getFieldValidation("pricePerMonth").icon}
                </div>
                {errors.pricePerMonth && (
                  <p className="text-sm text-red-500">{errors.pricePerMonth.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Dépôt de garantie (€) *</Label>
                <div className="relative">
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    {...register("deposit", { 
                      valueAsNumber: true,
                      required: "Le dépôt de garantie est requis",
                      min: { value: 0, message: "Le dépôt ne peut pas être négatif" }
                    })}
                    className={getFieldValidation("deposit").className}
                  />
                  {getFieldValidation("deposit").icon}
                </div>
                {errors.deposit && (
                  <p className="text-sm text-red-500">{errors.deposit.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
            <CardDescription>Agence où le véhicule est disponible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="locationId">Agence *</Label>
              <div className="relative">
                <Select
                  onValueChange={(value) => {
                    console.log("📍 DEBUG: Sélection de l'agence", value);
                    setValue("locationId", value, { shouldValidate: true, shouldDirty: true });
                    trigger("locationId");
                  }}
                  value={locationIdValue || locationOptions[0]?.value || ""}
                  defaultValue={locationOptions[0]?.value || ""}
                >
                  <SelectTrigger 
                    id="locationId" 
                    className={getSelectValidation("locationId").className}
                  >
                    <SelectValue placeholder="Sélectionner une agence" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getSelectValidation("locationId").icon}
              </div>
              {errors.locationId && (
                <p className="text-sm text-red-500">{errors.locationId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
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

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Description optionnelle du véhicule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Décrivez le véhicule..."
                  rows={4}
                  {...register("description")}
                  className={getFieldValidation("description").className}
                />
                {getFieldValidation("description").icon}
              </div>
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              {watch("description") && !errors.description && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Description valide ({watch("description")?.length || 0}/1000 caractères)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/vehicles">Annuler</Link>
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !formIsValid || imagesCount < 5}
            title={
              isSubmitting 
                ? "Création en cours..." 
                : !formIsValid 
                ? `Veuillez remplir tous les champs requis et corriger les erreurs (Erreurs: ${Object.keys(errors).length})` 
                : imagesCount < 5 
                ? `Au moins 5 images sont requises (${imagesCount}/5)` 
                : "Tous les champs sont valides, vous pouvez créer le véhicule"
            }
            className={
              formIsValid && imagesCount >= 5 && !isSubmitting 
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg" 
                : ""
            }
            onClick={() => {
              const allFormValues = watch();
              console.log("🔘 DEBUG BOUTON CLIQUÉ - TOUTES LES INFOS DU FORMULAIRE:");
              console.log("==========================================");
              console.log("📋 INFORMATIONS DE BASE:");
              console.log("  - Marque:", allFormValues.brand);
              console.log("  - Modèle:", allFormValues.model);
              console.log("  - Année:", allFormValues.year);
              console.log("  - Plaque d'immatriculation:", allFormValues.licensePlate);
              console.log("  - Kilométrage:", allFormValues.mileage);
              console.log("");
              console.log("🚗 CARACTÉRISTIQUES:");
              console.log("  - Catégorie:", allFormValues.category);
              console.log("  - Nombre de places:", allFormValues.seats);
              console.log("  - Transmission:", allFormValues.transmission);
              console.log("  - Carburant:", allFormValues.fuelType);
              console.log("  - Couleur:", allFormValues.color);
              console.log("");
              console.log("⚙️ ÉQUIPEMENTS:");
              console.log("  - Équipements sélectionnés:", allFormValues.features);
              console.log("  - Nombre d'équipements:", allFormValues.features?.length || 0);
              console.log("");
              console.log("💰 TARIFICATION:");
              console.log("  - Prix/jour:", allFormValues.pricePerDay, "€");
              console.log("  - Prix/semaine:", allFormValues.pricePerWeek, "€");
              console.log("  - Prix/mois:", allFormValues.pricePerMonth, "€");
              console.log("  - Dépôt de garantie:", allFormValues.deposit, "€");
              console.log("");
              console.log("📍 LOCALISATION:");
              console.log("  - Agence ID:", allFormValues.locationId);
              console.log("");
              console.log("🖼️ PHOTOS:");
              console.log("  - Nombre d'images:", images.length);
              console.log("  - URLs des images:", images);
              console.log("  - Images dans le formulaire:", allFormValues.images);
              console.log("");
              console.log("📝 DESCRIPTION:");
              console.log("  - Description:", allFormValues.description);
              console.log("  - Longueur:", allFormValues.description?.length || 0, "caractères");
              console.log("");
              console.log("✅ ÉTAT DU FORMULAIRE:");
              console.log("  - Formulaire valide:", formIsValid);
              console.log("  - Nombre d'images:", imagesCount);
              console.log("  - En cours de soumission:", isSubmitting);
              console.log("  - Bouton désactivé:", isSubmitting || !formIsValid || imagesCount < 5);
              console.log("  - Erreurs:", Object.keys(errors));
              console.log("  - Détails des erreurs:", errors);
              console.log("");
              console.log("📦 TOUTES LES DONNÉES (OBJET COMPLET):");
              console.log(allFormValues);
              console.log("==========================================");
            }}
          >
            {isSubmitting ? "Création en cours..." : "Créer le véhicule"}
          </Button>
        </div>
        {/* Afficher les erreurs de validation seulement s'il y en a vraiment */}
        {!isValid && isDirty && Object.keys(errors).length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-1">Veuillez corriger les erreurs suivantes :</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {errors.brand && <li>Marque : {errors.brand.message}</li>}
                {errors.model && <li>Modèle : {errors.model.message}</li>}
                {errors.year && <li>Année : {errors.year.message}</li>}
                {errors.licensePlate && <li>Plaque d&apos;immatriculation : {errors.licensePlate.message}</li>}
                {errors.mileage && <li>Kilométrage : {errors.mileage.message}</li>}
                {errors.category && <li>Catégorie : {errors.category.message}</li>}
                {errors.seats && <li>Nombre de places : {errors.seats.message}</li>}
                {errors.transmission && <li>Transmission : {errors.transmission.message}</li>}
                {errors.fuelType && <li>Carburant : {errors.fuelType.message}</li>}
                {errors.color && <li>Couleur : {errors.color.message}</li>}
                {errors.pricePerDay && <li>Prix par jour : {errors.pricePerDay.message}</li>}
                {errors.deposit && <li>Dépôt de garantie : {errors.deposit.message}</li>}
                {errors.locationId && <li>Localisation : {errors.locationId.message}</li>}
                {errors.images && <li>Images : {errors.images.message}</li>}
              </ul>
            </div>
          </div>
        )}
        {images.length < 5 && isDirty && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Au moins 5 images sont requises pour créer un véhicule. ({images.length}/5)</span>
          </div>
        )}
        {formIsValid && imagesCount >= 5 && !isSubmitting && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tous les champs sont valides ! Vous pouvez créer le véhicule.</span>
          </div>
        )}
      </form>
    </div>
  );
}

