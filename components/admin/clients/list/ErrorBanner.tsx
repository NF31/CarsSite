import { memo } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

export const ErrorBanner = memo(function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  return (
    <Card className="border-red-200 bg-red-50 text-red-800">
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium uppercase tracking-wide hover:underline"
        >
          Fermer
        </button>
      </CardContent>
    </Card>
  );
});

