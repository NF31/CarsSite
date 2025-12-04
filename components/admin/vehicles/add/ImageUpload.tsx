"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { UploadZone } from "./components/UploadZone";
import { ImageGrid } from "./components/ImageGrid";
import { ErrorMessages } from "./components/ErrorMessages";
import { ValidationMessages } from "./components/ValidationMessages";
import { validateImageFile, validateImageCount } from "./utils/image-validation";

interface ImageUploadProps {
  images: Array<{ url: string; publicId?: string; isMain?: boolean }>;
  onImagesChange: (images: Array<{ url: string; publicId?: string; isMain?: boolean }>) => void;
  error?: string;
  minImages?: number;
  maxImages?: number;
  brand?: string;
  model?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  error,
  minImages = 5,
  maxImages = 20,
  brand,
  model,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);

    // Valider le nombre de fichiers
    const countValidation = validateImageCount(images.length, files.length, maxImages);
    if (!countValidation.valid) {
      setUploadError(countValidation.error || "Erreur de validation");
      return;
    }

    // Valider chaque fichier
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || "Erreur de validation");
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    // Uploader les fichiers valides
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        // Simulation de progression pour chaque fichier
        const fileProgress = (index / validFiles.length) * 100;
        setUploadProgress(Math.min(fileProgress + 10, 90));

        const formData = new FormData();
        formData.append("file", file);
        if (brand) {
          formData.append("brand", brand);
        }
        if (model) {
          formData.append("model", model);
        }

        const { uploadImageAction } = await import("@/actions/admin/vehicles/upload-image");
        const result = await uploadImageAction(formData);

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de l'upload");
        }

        if (!result.data) {
          throw new Error("Aucune donnée retournée");
        }

        return {
          url: result.data.url,
          publicId: result.data.publicId,
        };
      });

      const uploadedData = await Promise.all(uploadPromises);
      setUploadProgress(100);

      // Ajouter les nouvelles images (la première sera automatiquement principale si aucune n'existe)
      const hasMainImage = images.some((img) => img.isMain);
      const newImages = uploadedData.map((data, index) => ({
        url: data.url,
        publicId: data.publicId,
        isMain: !hasMainImage && images.length === 0 && index === 0,
      }));

      onImagesChange([...images, ...newImages]);
      setUploadProgress(0);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload des images");
    } finally {
      setUploading(false);
      // Réinitialiser l'input file
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);

    // Si on supprime l'image principale, la première devient principale
    if (images[index].isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }

    onImagesChange(newImages);
  };

  const handleSetMainImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    onImagesChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Simuler un changement de fichier
    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((file) => dataTransfer.items.add(file));

    // Créer un input temporaire pour simuler l'événement
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.files = dataTransfer.files;
    const event = {
      target: tempInput,
    } as React.ChangeEvent<HTMLInputElement>;
    await handleFileSelect(event);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Photos du véhicule *</Label>
        <UploadZone
          imagesCount={images.length}
          maxImages={maxImages}
          minImages={minImages}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onFileSelect={handleFileSelect}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>

      <ErrorMessages
        uploadError={uploadError}
        validationError={error}
        onDismissUploadError={() => setUploadError(null)}
      />

      {images.length > 0 && (
        <div className="space-y-4">
          <ImageGrid
            images={images}
            onSetMain={handleSetMainImage}
            onRemove={handleRemoveImage}
          />
          <ValidationMessages
            imagesCount={images.length}
            minImages={minImages}
            uploading={uploading}
          />
        </div>
      )}

      {images.length === 0 && !uploading && (
        <ValidationMessages
          imagesCount={images.length}
          minImages={minImages}
          uploading={uploading}
        />
      )}
    </div>
  );
}
