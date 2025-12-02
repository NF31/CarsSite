import { Check, AlertCircle } from "lucide-react";
import { memo } from "react";

interface MessageBannerProps {
  message: { type: "success" | "error"; text: string };
  onClose: () => void;
}

export const MessageBanner = memo(function MessageBanner({
  message,
  onClose,
}: MessageBannerProps) {
  const isSuccess = message.type === "success";

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <span>{message.text}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-medium uppercase tracking-wide text-current transition-opacity hover:opacity-70"
      >
        Fermer
      </button>
    </div>
  );
});

