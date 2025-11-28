import { memo } from "react";
import { Car } from "lucide-react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const LoginHeader = memo(function LoginHeader() {
  return (
    <CardHeader className="space-y-1 text-center pb-4 sm:pb-6 px-4 sm:px-6 pt-6 sm:pt-8">
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className="rounded-full bg-primary/10 p-2 sm:p-3">
          <Car className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
      </div>
      <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
        Connexion
      </CardTitle>
      <CardDescription className="text-sm sm:text-base text-gray-600">
        Connectez-vous à votre compte pour continuer
      </CardDescription>
    </CardHeader>
  );
});

