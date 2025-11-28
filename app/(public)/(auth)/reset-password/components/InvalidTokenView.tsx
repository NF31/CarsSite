import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface InvalidTokenViewProps {
  error: string | null;
}

export const InvalidTokenView = memo(function InvalidTokenView({
  error,
}: InvalidTokenViewProps) {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="rounded-full bg-red-100 p-2 sm:p-3">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Lien invalide
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Ce lien de réinitialisation est invalide ou a expiré
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md mb-4">
            <p className="break-words">
              {error || "Le lien que vous avez utilisé est invalide ou a expiré. Veuillez demander un nouveau lien de réinitialisation."}
            </p>
          </div>
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/forgot-password">
                Demander un nouveau lien
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

