import { memo } from "react";
import { CheckCircle2 } from "lucide-react";

export const SuccessBanner = memo(function SuccessBanner() {
  return (
    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
      <span className="flex-1 break-words">
        Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.
      </span>
    </div>
  );
});

