"use client";

import { AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface ValidationMessagesProps {
  imagesCount: number;
  minImages: number;
  uploading: boolean;
}

export function ValidationMessages({
  imagesCount,
  minImages,
  uploading,
}: ValidationMessagesProps) {
  if (imagesCount === 0 && !uploading) {
    return (
      <div className="flex items-center justify-center py-8 text-center border rounded-lg bg-gray-50">
        <div>
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune image ajoutée. Ajoutez au moins {minImages} images.
          </p>
        </div>
      </div>
    );
  }

  if (imagesCount < minImages) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">
          {minImages - imagesCount} image{minImages - imagesCount > 1 ? "s" : ""} supplémentaire
          {minImages - imagesCount > 1 ? "s" : ""} requise{minImages - imagesCount > 1 ? "s" : ""} (minimum {minImages})
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5" />
      <p className="text-sm">
        {imagesCount} image{imagesCount > 1 ? "s" : ""} ajoutée{imagesCount > 1 ? "s" : ""} • Minimum requis atteint
      </p>
    </div>
  );
}

