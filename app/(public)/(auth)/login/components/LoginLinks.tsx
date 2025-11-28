import { memo } from "react";
import Link from "next/link";

export const LoginLinks = memo(function LoginLinks() {
  return (
    <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-center">
      <div className="text-xs sm:text-sm">
        <Link
          href="/forgot-password"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Mot de passe oublié ?
        </Link>
      </div>
      <div className="text-xs sm:text-sm">
        <span className="text-muted-foreground">
          Vous n'avez pas de compte ?{" "}
        </span>
        <Link
          href="/register"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          S'inscrire
        </Link>
      </div>
    </div>
  );
});

