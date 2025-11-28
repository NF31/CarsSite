import { useState } from "react";

export function useVehicleImageGallery(images: string[]) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const hasMultipleImages = images.length > 1;

  const selectImage = (index: number) => {
    if (index >= 0 && index < images.length) {
      setSelectedImageIndex(index);
    }
  };

  return {
    selectedImageIndex,
    selectImage,
    hasMultipleImages,
    currentImage: images[selectedImageIndex] || images[0],
  };
}

