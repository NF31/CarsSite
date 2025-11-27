"use client";

import { memo } from "react";
import { AlertCircle } from "lucide-react";

interface ServerErrorAlertProps {
  error: string;
  onDismiss: () => void;
}

export const ServerErrorAlert = memo(function ServerErrorAlert({
  error,
  onDismiss,
}: ServerErrorAlertProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
      <button
        type="button"
        className="text-xs font-medium uppercase tracking-wide hover:underline"
        onClick={onDismiss}
      >
        Fermer
      </button>
    </div>
  );
});

