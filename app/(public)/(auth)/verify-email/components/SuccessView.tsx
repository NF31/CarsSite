import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SuccessViewProps {
  message: string;
}

export const SuccessView = memo(function SuccessView({ message }: SuccessViewProps) {
  return (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground">
        {message || "Email vérifié avec succès !"}
      </p>
      <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white">
        <Link href="/login?verified=true">Se connecter maintenant</Link>
      </Button>
    </div>
  );
});

