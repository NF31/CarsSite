"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { MessageState } from "../types";

interface MessageAlertProps {
  message: MessageState | null;
  onClose: () => void;
}

/**
 * Composant d'alerte pour afficher les messages de succès ou d'erreur
 */
export function MessageAlert({ message, onClose }: MessageAlertProps) {
  if (!message) {
    return null;
  }

  const isSuccess = message.type === "success";
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span>{message.text}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-medium uppercase tracking-wide text-current transition-opacity hover:opacity-70"
        aria-label="Fermer la notification"
      >
        Fermer
      </button>
    </div>
  );
}

