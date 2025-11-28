import { memo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeedbackBannerProps {
  type: "error" | "success";
  message: string;
  onDismiss?: () => void;
}

export const FeedbackBanner = memo(function FeedbackBanner({
  type,
  message,
}: FeedbackBannerProps) {
  if (type === "error") {
    return (
      <Card className="border-red-200 bg-red-50 text-red-800">
        <CardContent className="flex items-center gap-3 py-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
      <CardContent className="flex items-center gap-3 py-3">
        <CheckCircle2 className="h-5 w-5" />
        <p className="text-sm font-medium">{message}</p>
      </CardContent>
    </Card>
  );
});

