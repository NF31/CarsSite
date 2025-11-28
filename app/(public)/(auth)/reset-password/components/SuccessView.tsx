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
import { CheckCircle2 } from "lucide-react";

export const SuccessView = memo(function SuccessView() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 sm:py-8 md:py-12 px-4 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="rounded-full bg-green-100 p-2 sm:p-3">
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Mot de passe réinitialisé
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-gray-600">
            Votre mot de passe a été réinitialisé avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm p-2.5 sm:p-3 rounded-md mb-4">
            <p>Vous allez être redirigé vers la page de connexion dans quelques secondes...</p>
          </div>
          <Button className="w-full" asChild>
            <Link href="/login">
              Se connecter maintenant
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

