import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";

interface ErrorViewProps {
  message: string;
  email: string | null;
  isResending: boolean;
  onResendVerification: () => void;
}

export const ErrorView = memo(function ErrorView({
  message,
  email,
  isResending,
  onResendVerification,
}: ErrorViewProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {message || "Le lien de vérification est invalide ou a expiré."}
      </p>
      
      {email && (
        <Button
          onClick={onResendVerification}
          disabled={isResending}
          variant="outline"
          className="w-full"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Renvoyer l&apos;email de vérification
            </>
          )}
        </Button>
      )}
      
      <Button asChild variant="ghost" className="w-full">
        <Link href="/register">Créer un nouveau compte</Link>
      </Button>
    </div>
  );
});

