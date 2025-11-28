import { memo } from "react";
import Link from "next/link";
import { Gift, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServicesHeaderProps {
  onResetFilters: () => void;
}

export const ServicesHeader = memo(function ServicesHeader({
  onResetFilters,
}: ServicesHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Services additionnels</h1>
        <p className="text-sm text-muted-foreground">
          Consultez les services proposés lors des réservations et leur disponibilité par
          catégorie.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onResetFilters}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
        <Button asChild>
          <Link href="/admin/services/add" className="inline-flex items-center">
            <Gift className="mr-2 h-4 w-4" />
            Nouveau service
          </Link>
        </Button>
      </div>
    </header>
  );
});

