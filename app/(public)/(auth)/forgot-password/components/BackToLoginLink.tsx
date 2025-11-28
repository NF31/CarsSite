import { memo } from "react";
import Link from "next/link";

export const BackToLoginLink = memo(function BackToLoginLink() {
  return (
    <div className="mt-4 sm:mt-6 text-center">
      <div className="text-xs sm:text-sm">
        <span className="text-muted-foreground">Vous vous souvenez de votre mot de passe ? </span>
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
});

