import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-start justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        <span className="text-xs sm:text-sm break-words">{message}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="text-red-700 hover:text-red-900 transition-colors flex-shrink-0 h-auto w-auto p-0"
        aria-label="Fermer le message d'erreur"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

