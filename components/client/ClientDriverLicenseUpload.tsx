"use client";

import { useRef, useState } from "react";
import { uploadMyDriverLicenseAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, ShieldCheck, Upload, XCircle, FileText } from "lucide-react";

interface ClientDriverLicenseUploadProps {
  userName?: string | null;
  existingUrl?: string | null;
  uploadCount: number;
  lastUploadedAt: string | null;
  maxReplacements: number;
  cooldownDays: number;
  onUploaded: (payload: {
    url: string;
    publicId: string;
    uploadCount: number;
    lastUploadedAt: string;
    nextAllowedAt: string | null;
    maxReplacements: number;
    cooldownDays: number;
  }) => void;
  onDismiss: () => void;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function validateLocalFile(file: File): string | null {
  const fileName = file.name?.toLowerCase() ?? "";
  const mimeType = file.type;

  if (!mimeType || mimeType !== "application/pdf") {
    return "Le fichier doit être un PDF.";
  }

  if (!fileName.endsWith(".pdf")) {
    return "Le fichier doit avoir l'extension .pdf.";
  }

  if (file.size > MAX_SIZE_BYTES) {
    return "Le PDF dépasse la taille maximale autorisée (10 Mo).";
  }

  return null;
}

export function ClientDriverLicenseUpload({
  userName,
  existingUrl,
  uploadCount,
  lastUploadedAt,
  maxReplacements,
  cooldownDays,
  onUploaded,
  onDismiss,
}: ClientDriverLicenseUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const lastUploadedDate = lastUploadedAt ? new Date(lastUploadedAt) : null;
  const now = Date.now();

  let normalizedCount = uploadCount ?? 0;
  let nextAllowedAt: Date | null = null;

  if (lastUploadedDate) {
    const elapsed = now - lastUploadedDate.getTime();
    if (elapsed > cooldownMs) {
      normalizedCount = 0;
    } else if (normalizedCount >= maxReplacements) {
      nextAllowedAt = new Date(lastUploadedDate.getTime() + cooldownMs);
    }
  }

  const remaining = Math.max(maxReplacements - normalizedCount, 0);
  const isBlocked = remaining === 0 && nextAllowedAt !== null;

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setFileLabel(null);
  };

  const simulateProgress = (step: number) => {
    setProgress((prev) => Math.min(prev + step, 95));
  };

  const performUpload = async (file: File) => {
    if (isBlocked) {
      const message = nextAllowedAt
        ? `La limite de remplacement (${maxReplacements}) a été atteinte. Prochain téléversement autorisé le ${DATE_FORMATTER.format(
            nextAllowedAt
          )}.`
        : "La limite de remplacement du permis a été atteinte.";
      setError(message);
      resetInput();
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);
    setFileLabel(file.name);

    try {
      simulateProgress(15);
      const formData = new FormData();
      formData.append("file", file);

      simulateProgress(20);
      const result = await uploadMyDriverLicenseAction(formData);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Échec du téléversement du permis.");
      }

      setProgress(100);
      onUploaded({
        url: result.data.url,
        publicId: result.data.publicId,
        uploadCount: result.data.uploadCount,
        lastUploadedAt: result.data.lastUploadedAt,
        nextAllowedAt: result.data.nextAllowedAt,
        maxReplacements: result.data.maxReplacements,
        cooldownDays: result.data.cooldownDays,
      });
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Erreur inconnue lors du téléversement.";
      setError(message);
      setProgress(0);
      setUploading(false);
      resetInput();
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    if (isBlocked) {
      const message = nextAllowedAt
        ? `La limite de remplacement (${maxReplacements}) a été atteinte. Prochain téléversement autorisé le ${DATE_FORMATTER.format(
            nextAllowedAt
          )}.`
        : "La limite de remplacement du permis a été atteinte.";
      setError(message);
      resetInput();
      return;
    }

    const file = files[0];
    const validationError = validateLocalFile(file);
    if (validationError) {
      setError(validationError);
      resetInput();
      return;
    }

    await performUpload(file);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(event.target.files);
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div>
            <p className="font-medium text-gray-900">
              {userName ? `Permis de ${userName}` : "Permis de conduire"}
            </p>
            <p className="text-xs text-muted-foreground">
              {existingUrl
                ? "Vous pouvez remplacer votre permis de conduire. Le document précédent sera supprimé."
                : "Téléversez votre permis de conduire en format PDF. Le document sera stocké de manière sécurisée."}
            </p>
            {remaining < maxReplacements && (
              <p className="mt-1 text-xs text-amber-600">
                Remplacements restants : {remaining} / {maxReplacements}
              </p>
            )}
            {isBlocked && nextAllowedAt && (
              <p className="mt-1 text-xs text-red-600">
                Limite atteinte. Prochain remplacement possible le {DATE_FORMATTER.format(nextAllowedAt)}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          uploading
            ? "border-primary bg-primary/5"
            : isBlocked
            ? "border-red-300 bg-red-50/50"
            : "border-gray-300 bg-gray-50/50 hover:border-gray-400"
        )}
      >
        <label
          htmlFor="driver-license-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center p-8",
            (uploading || isBlocked) && "cursor-not-allowed opacity-60"
          )}
        >
          <input
            ref={inputRef}
            id="driver-license-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={uploading || isBlocked}
            className="hidden"
          />

          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm font-medium text-gray-900">Téléversement en cours...</p>
              <p className="mt-1 text-xs text-muted-foreground">{fileLabel}</p>
              {progress > 0 && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs text-muted-foreground">{progress}%</p>
                </div>
              )}
            </>
          ) : (
            <>
              {isBlocked ? (
                <XCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
              <p className="mt-4 text-sm font-medium text-gray-900">
                {isBlocked
                  ? "Limite de remplacement atteinte"
                  : existingUrl
                  ? "Glissez-déposez un nouveau PDF ou cliquez pour sélectionner"
                  : "Glissez-déposez votre PDF ou cliquez pour sélectionner"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF uniquement, maximum 10 Mo
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDismiss} disabled={uploading}>
          {existingUrl ? "Annuler" : "Fermer"}
        </Button>
      </div>
    </div>
  );
}

