import { memo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon } from "lucide-react";

interface VehicleImageGalleryProps {
  images: string[];
  brand: string;
  model: string;
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
}

export const VehicleImageGallery = memo(function VehicleImageGallery({
  images,
  brand,
  model,
  selectedImageIndex,
  onImageSelect,
}: VehicleImageGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Aucune image disponible</p>
            <p className="text-sm">Ajoutez des images dans la page de modification du véhicule.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasMultipleImages = images.length > 1;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          <Image
            src={images[selectedImageIndex]}
            alt={`${brand} ${model} - Image ${selectedImageIndex + 1}`}
            fill
            className="object-cover"
            priority
          />
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => onImageSelect(index)}
                  className={`h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                    index === selectedImageIndex
                      ? "bg-white w-7"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        {hasMultipleImages && (
          <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-6 lg:grid-cols-8">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onImageSelect(index)}
                className={`relative aspect-video overflow-hidden rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  index === selectedImageIndex
                    ? "border-primary"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image
                  src={image}
                  alt={`${brand} ${model} - Miniature ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

