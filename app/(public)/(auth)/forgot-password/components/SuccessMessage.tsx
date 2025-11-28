import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const SuccessMessage = memo(function SuccessMessage() {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium mb-1">Email envoyé !</p>
          <p className="break-words">
            Si cet email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques instants.
          </p>
          <p className="mt-2 text-xs">
            Vérifiez votre boîte de réception et vos spams.
          </p>
        </div>
      </div>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/login">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la connexion
        </Link>
      </Button>
    </div>
  );
});

