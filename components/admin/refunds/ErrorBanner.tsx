import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBannerProps {
  message: string;
}

export const ErrorBanner = memo(function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Erreur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-600">{message}</p>
      </CardContent>
    </Card>
  );
});

