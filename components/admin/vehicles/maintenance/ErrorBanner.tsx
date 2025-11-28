import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner = memo(function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <Card className="p-4 border border-red-200 bg-red-50 text-red-800">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </Card>
  );
});

