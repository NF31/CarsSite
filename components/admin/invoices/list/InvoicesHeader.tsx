import { memo } from "react";
import { Receipt, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InvoicesHeader = memo(function InvoicesHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
        <p className="text-sm text-muted-foreground">
          Téléchargez et envoyez les factures clients en un clic. Suivez leurs statuts en temps réel.
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row">
        <Button variant="outline" disabled>
          <Receipt className="mr-2 h-4 w-4" />
          Générer une facture (bientôt)
        </Button>
        <Button disabled>
          <Mail className="mr-2 h-4 w-4" />
          Envoyer en masse (bientôt)
        </Button>
      </div>
    </header>
  );
});

