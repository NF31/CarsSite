import { memo } from "react";

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

export const ErrorBanner = memo(function ErrorBanner({
  message,
  onClose,
}: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <div className="flex items-center gap-2">
        <span aria-hidden>⚠️</span>
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

