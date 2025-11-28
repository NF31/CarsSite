import { memo } from "react";
import Link from "next/link";

export const RegisterLinks = memo(function RegisterLinks() {
  return (
    <div className="mt-4 sm:mt-6 text-center">
      <p className="text-xs sm:text-sm text-gray-600">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
});

