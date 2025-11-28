import { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessBannerProps {
  message: string;
  onClose: () => void;
}

export const SuccessBanner = memo(function SuccessBanner({
  message,
  onClose,
}: SuccessBannerProps) {
  return (
    <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
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

