import { memo } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  error: string;
}

export const ErrorBanner = memo(function ErrorBanner({ error }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
      <span className="flex-1 break-words">{error}</span>
    </div>
  );
});

