import { memo } from "react";
import { CheckCircle2 } from "lucide-react";

interface SuccessBannerProps {
  message: string;
  onClose: () => void;
}

export const SuccessBanner = memo(function SuccessBanner({
  message,
  onClose,
}: SuccessBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-semibold uppercase tracking-wide hover:opacity-75"
      >
        Fermer
      </button>
    </div>
  );
});

