import { memo } from "react";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type VerifyEmailStatus } from "../hooks";

interface VerifyEmailHeaderProps {
  status: VerifyEmailStatus;
  message: string;
}

export const VerifyEmailHeader = memo(function VerifyEmailHeader({
  status,
  message,
}: VerifyEmailHeaderProps) {
  const getTitle = () => {
    if (status === "loading") return "Vérification en cours...";
    if (status === "success") return "Email vérifié !";
    if (status === "error") return "Erreur de vérification";
    return "Vérification d'email";
  };

  return (
    <CardHeader className="space-y-1 text-center">
      {status === "loading" && (
        <div className="flex justify-center mb-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      )}
      {status === "success" && (
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
      )}
      {status === "error" && (
        <div className="flex justify-center mb-4">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
      )}
      {!status && (
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-primary" />
        </div>
      )}

      <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
      <CardDescription>{message || "Vérification de votre email..."}</CardDescription>
    </CardHeader>
  );
});

