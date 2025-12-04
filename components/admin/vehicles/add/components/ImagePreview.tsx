"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";

interface ImagePreviewProps {
  image: { url: string; isMain?: boolean };
  index: number;
  onSetMain: () => void;
  onRemove: () => void;
}

export function ImagePreview({ image, index, onSetMain, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative group">
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
        {image.isMain && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shadow-md">
              <Star className="h-3 w-3 fill-current" />
              Principale
            </div>
          </div>
        )}
        <Image
          src={image.url}
          alt={`Image ${index + 1}`}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E";
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {!image.isMain && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSetMain}
              className="h-8 bg-white/90 hover:bg-white"
            >
              <Star className="h-4 w-4 mr-1" />
              Définir principale
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="h-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-center text-gray-500 mt-1">Image {index + 1}</p>
    </div>
  );
}

