"use client";

import { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  imagesCount: number;
  maxImages: number;
  minImages: number;
  uploading: boolean;
  uploadProgress: number;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function UploadZone({
  imagesCount,
  maxImages,
  minImages,
  uploading,
  uploadProgress,
  onFileSelect,
  onDragOver,
  onDrop,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!uploading && imagesCount < maxImages) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileSelect}
        className="hidden"
        disabled={uploading || imagesCount >= maxImages}
      />

      {imagesCount === 0 && !uploading ? (
        <div
          onClick={handleClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            "border-gray-300 hover:border-primary/50 bg-gray-50 hover:bg-gray-100"
          )}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Cliquez pour sélectionner des images
          </p>
          <p className="text-sm text-gray-600 mb-1">
            ou glissez-déposez vos images ici
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF, WebP jusqu&apos;à 10MB • Minimum {minImages} images requises
          </p>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            uploading
              ? "border-primary bg-primary/5 cursor-wait"
              : "border-gray-300 hover:border-primary/50 cursor-pointer bg-gray-50"
          )}
          onClick={handleClick}
        >
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Upload en cours...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">{Math.round(uploadProgress)}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">
                {imagesCount < maxImages
                  ? "Cliquez pour ajouter plus d&apos;images"
                  : "Nombre maximum d&apos;images atteint"}
              </p>
              <p className="text-xs text-gray-600">
                {imagesCount} / {maxImages} images ({minImages} minimum)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

