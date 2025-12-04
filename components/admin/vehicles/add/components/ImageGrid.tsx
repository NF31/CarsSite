"use client";

import { ImagePreview } from "./ImagePreview";

interface ImageGridProps {
  images: Array<{ url: string; isMain?: boolean }>;
  onSetMain: (index: number) => void;
  onRemove: (index: number) => void;
}

export function ImageGrid({ images, onSetMain, onRemove }: ImageGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <ImagePreview
          key={index}
          image={image}
          index={index}
          onSetMain={() => onSetMain(index)}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
}

