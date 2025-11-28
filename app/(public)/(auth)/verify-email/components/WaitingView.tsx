import { memo } from "react";
import { Button } from "@/components/ui/button";
import { XCircle, Mail, Loader2 } from "lucide-react";
import { type VerifyEmailStatus } from "../hooks";

interface WaitingViewProps {
  message: string;
  error: string | null;
  devToken: string | null;
  email: string | null;
  isResending: boolean;
  onVerifyEmail: (token: string) => void;
  onResendVerification: () => void;
}

export const WaitingView = memo(function WaitingView({
  message,
  error,
  devToken,
  email,
  isResending,
  onVerifyEmail,
  onResendVerification,
}: WaitingViewProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">{message}</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {devToken && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Mode développement - Lien de vérification :
          </p>
          <p className="text-xs text-yellow-700 mb-3 break-all">
            {`${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/verify-email?token=${devToken}`}
          </p>
          <Button onClick={() => onVerifyEmail(devToken)} className="w-full">
            Vérifier maintenant
          </Button>
        </div>
      )}
      
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
              Renvoyer l'email de vérification
            </>
          )}
        </Button>
      )}
    </div>
  );
});

