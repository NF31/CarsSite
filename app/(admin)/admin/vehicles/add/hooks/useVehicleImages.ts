import { useState, useCallback } from "react";
import type { UseFormSetValue, UseFormTrigger } from "react-hook-form";
import type { CreateVehicleInput } from "@/lib/validations/vehicle";

interface ImageData {
  url: string;
  publicId?: string;
  isMain?: boolean;
}

interface UseVehicleImagesProps {
  setValue: UseFormSetValue<CreateVehicleInput>;
  trigger: UseFormTrigger<CreateVehicleInput>;
}

export function useVehicleImages({ setValue, trigger }: UseVehicleImagesProps) {
  const [images, setImages] = useState<ImageData[]>([]);

  const handleImagesChange = useCallback(
    (newImages: ImageData[]) => {
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
    },
    [setValue, trigger],
  );

  return {
    images,
    handleImagesChange,
    imagesCount: images.length,
  };
}

