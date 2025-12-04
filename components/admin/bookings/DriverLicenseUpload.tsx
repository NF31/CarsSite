"use client";

import { useRef, useState } from "react";
import { uploadDriverLicenseAction } from "@/actions/admin/bookings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, ShieldCheck, Upload, XCircle, FileText } from "lucide-react";

interface DriverLicenseUploadProps {
  userId: string;
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
    return "Le PDF dépasse la taille maximale autorisée (10 Mo).";
  }

  return null;
}

export function DriverLicenseUpload({
  userId,
  userName,
  existingUrl,
  uploadCount,
  lastUploadedAt,
  maxReplacements,
  cooldownDays,
  onUploaded,
  onDismiss,
}: DriverLicenseUploadProps) {
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
      formData.append("userId", userId);
      formData.append("file", file);

      simulateProgress(20);
      const result = await uploadDriverLicenseAction(formData);

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
              Seuls les fichiers PDF sont acceptés. Taille maximale&nbsp;: 10 Mo.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vous pouvez remplacer le permis jusqu&apos;à {maxReplacements} fois tous les {cooldownDays} jours.{" "}
              {isBlocked
                ? nextAllowedAt && (
                    <span className="text-amber-600">
                      Prochain remplacement autorisé le {DATE_FORMATTER.format(nextAllowedAt)}.
                    </span>
                  )
                : `Il vous reste ${remaining} remplacement(s) possible(s).`}
            </p>
            {existingUrl && (
              <p className="mt-1 text-xs text-emerald-600">
                Un permis est déjà enregistré. Téléversez un nouveau document pour le remplacer.
              </p>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition",
          uploading
            ? "border-primary bg-primary/5 cursor-wait"
            : isBlocked
            ? "border-muted-foreground/30 bg-muted/20 cursor-not-allowed opacity-60"
            : "border-muted-foreground/30 bg-muted/30 hover:border-primary/60 cursor-pointer"
        )}
        onClick={() => {
          if (!uploading && !isBlocked) {
            inputRef.current?.click();
          }
        }}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-gray-900">Téléversement en cours…</p>
            <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{fileLabel ?? "Préparation du document…"}</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Cliquez pour choisir un PDF ou faites-le glisser ici
              </p>
              <p className="text-xs text-muted-foreground">
                Formats acceptés&nbsp;: PDF uniquement • Taille max 10 Mo
              </p>
            </div>
            {fileLabel && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {fileLabel}
              </div>
            )}
          </>
        )}
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onDismiss} disabled={uploading}>
          Annuler
        </Button>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading || isBlocked}>
          {uploading ? "Téléversement…" : "Sélectionner un PDF"}
        </Button>
      </div>
    </div>
  );
}


