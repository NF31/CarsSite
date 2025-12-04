import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/vehicles/add/ImageUpload";
import { useWatch, type Control, type FieldErrors } from "react-hook-form";
import type { UpdateVehicleInput } from "@/lib/validations/vehicle";

interface ImageData {
  url: string;
  publicId?: string;
  isMain?: boolean;
}

interface VehicleImagesSectionProps {
  images: ImageData[];
  onImagesChange: (images: ImageData[]) => void;
  errors: FieldErrors<UpdateVehicleInput>;
  control: Control<UpdateVehicleInput>;
}

export const VehicleImagesSection = memo(function VehicleImagesSection({
  images,
  onImagesChange,
  errors,
  control,
}: VehicleImagesSectionProps) {
  const brand = useWatch({ control, name: "brand" });
  const model = useWatch({ control, name: "model" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
        <CardDescription>
          Modifiez les photos du véhicule. Au moins 5 photos sont requises. Définissez une image principale qui sera affichée en premier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUpload
          images={images}
          onImagesChange={onImagesChange}
          error={errors.images?.message}
          minImages={5}
          maxImages={20}
          brand={brand}
          model={model}
        />
      </CardContent>
    </Card>
  );
});

