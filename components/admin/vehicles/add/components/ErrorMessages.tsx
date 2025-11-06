"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

interface ErrorMessagesProps {
  uploadError: string | null;
  validationError?: string;
  onDismissUploadError: () => void;
}

export function ErrorMessages({
  uploadError,
  validationError,
  onDismissUploadError,
}: ErrorMessagesProps) {
  return (
    <>
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
            onClick={onDismissUploadError}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{validationError}</p>
        </div>
      )}
    </>
  );
}

