"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Star, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: Array<{ url: string; isMain?: boolean }>;
  onImagesChange: (images: Array<{ url: string; isMain?: boolean }>) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);

    // Vérifier le nombre de fichiers
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      setUploadError(`Vous ne pouvez ajouter que ${remainingSlots} image${remainingSlots > 1 ? "s" : ""} supplémentaire${remainingSlots > 1 ? "s" : ""}.`);
      return;
    }

    // Valider chaque fichier
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      // Validation du type de fichier
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Le fichier "${file.name}" n'est pas un format d'image valide. Formats acceptés: JPG, PNG, GIF, WebP`);
        continue;
      }

      // Vérifier l'extension
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        setUploadError(`L'extension du fichier "${file.name}" n'est pas autorisée.`);
        continue;
      }

      // Validation de la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Le fichier "${file.name}" est trop volumineux (max 10MB).`);
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

        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setUploadProgress(100);

      // Ajouter les nouvelles images (la première sera automatiquement principale si aucune n'existe)
      const hasMainImage = images.some((img) => img.isMain);
      const newImages = uploadedUrls.map((url, index) => ({
        url,
        isMain: !hasMainImage && images.length === 0 && index === 0,
      }));

      onImagesChange([...images, ...newImages]);
      setUploadProgress(0);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload des images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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

    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      const event = {
        target: fileInputRef.current,
      } as React.ChangeEvent<HTMLInputElement>;
      await handleFileSelect(event);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Photos du véhicule *</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        {images.length === 0 && !uploading ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              uploading
                ? "border-primary bg-primary/5 cursor-wait"
                : "border-gray-300 hover:border-primary/50 cursor-pointer bg-gray-50"
            )}
            onClick={() => !uploading && images.length < maxImages && fileInputRef.current?.click()}
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
                  {images.length < maxImages
                    ? "Cliquez pour ajouter plus d&apos;images"
                    : "Nombre maximum d&apos;images atteint"}
                </p>
                <p className="text-xs text-gray-600">
                  {images.length} / {maxImages} images ({minImages} minimum)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Erreur d&apos;upload</p>
            <p className="text-sm">{uploadError}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => setUploadError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
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
                        onClick={() => handleSetMainImage(index)}
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
                      onClick={() => handleRemoveImage(index)}
                      className="h-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-1">Image {index + 1}</p>
              </div>
            ))}
          </div>

          {images.length < minImages && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                {minImages - images.length} image{minImages - images.length > 1 ? "s" : ""} supplémentaire
                {minImages - images.length > 1 ? "s" : ""} requise{minImages - images.length > 1 ? "s" : ""} (minimum {minImages})
              </p>
            </div>
          )}

          {images.length >= minImages && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">
                {images.length} image{images.length > 1 ? "s" : ""} ajoutée{images.length > 1 ? "s" : ""} • Minimum requis atteint
              </p>
            </div>
          )}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="flex items-center justify-center py-8 text-center border rounded-lg bg-gray-50">
          <div>
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune image ajoutée. Ajoutez au moins {minImages} images.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
