"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import type { CreateVehicleInput, UpdateVehicleInput } from "@/lib/validations/vehicle";

interface FormActionsProps {
  form: UseFormReturn<CreateVehicleInput | UpdateVehicleInput>;
  isSubmitting: boolean;
  imagesCount: number;
  isValid: boolean;
  isDirty: boolean;
  isEditMode?: boolean;
}

export function FormActions({
  form,
  isSubmitting,
  imagesCount,
  isValid,
  isDirty,
  isEditMode = false,
}: FormActionsProps) {
  const { formState: { errors } } = form;
  const formIsValid = isValid && imagesCount >= 5;
  
  const submitButtonText = isEditMode 
    ? (isSubmitting ? "Modification en cours..." : "Modifier le véhicule")
    : (isSubmitting ? "Création en cours..." : "Créer le véhicule");
  
  const submitButtonTitle = isSubmitting 
    ? (isEditMode ? "Modification en cours..." : "Création en cours...")
    : !isValid 
    ? `Veuillez remplir tous les champs requis et corriger les erreurs (Erreurs: ${Object.keys(errors).length})` 
    : imagesCount < 5 
    ? `Au moins 5 images sont requises (${imagesCount}/5)` 
    : isEditMode
    ? "Tous les champs sont valides, vous pouvez modifier le véhicule"
    : "Tous les champs sont valides, vous pouvez créer le véhicule";
  
  const successMessage = isEditMode
    ? "Tous les champs sont valides ! Vous pouvez modifier le véhicule."
    : "Tous les champs sont valides ! Vous pouvez créer le véhicule.";
  
  const imagesMessage = isEditMode
    ? `Au moins 5 images sont requises pour modifier un véhicule. (${imagesCount}/5)`
    : `Au moins 5 images sont requises pour créer un véhicule. (${imagesCount}/5)`;

  return (
    <>
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/vehicles">Annuler</Link>
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formIsValid}
          title={submitButtonTitle}
          className={
            formIsValid && !isSubmitting 
              ? "bg-green-600 hover:bg-green-700 text-white shadow-lg" 
              : ""
          }
        >
          {submitButtonText}
        </Button>
      </div>

      {/* Messages de validation */}
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
      {imagesCount < 5 && isDirty && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{imagesMessage}</span>
        </div>
      )}
      {formIsValid && !isSubmitting && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}
    </>
  );
}

