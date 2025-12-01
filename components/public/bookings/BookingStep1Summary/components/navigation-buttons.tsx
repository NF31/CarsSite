import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NavigationButtonsProps {
  onNext: () => void;
  canGoNext: boolean;
  isCheckingAvailability: boolean;
  isCalculatingPrice: boolean;
}

export function NavigationButtons({
  onNext,
  canGoNext,
  isCheckingAvailability,
  isCalculatingPrice,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isCheckingAvailability || isCalculatingPrice}
        className="w-full sm:w-auto"
      >
        {isCheckingAvailability ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Vérification...
          </>
        ) : isCalculatingPrice ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Calcul...
          </>
        ) : (
          "Suivant"
        )}
      </Button>
    </div>
  );
}

