import { memo } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner = memo(function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
      <AlertCircle className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
});

