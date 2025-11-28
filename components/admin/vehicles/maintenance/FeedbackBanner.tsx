import { memo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export const FeedbackBanner = memo(function FeedbackBanner({
  type,
  message,
  onClose,
}: FeedbackBannerProps) {
  return (
    <Card
      className={cn(
        "p-4 border",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Card>
  );
});

