import { memo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ServiceFormHeaderProps {
  isEditMode: boolean;
}

export const ServiceFormHeader = memo(function ServiceFormHeader({
  isEditMode,
}: ServiceFormHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/admin/services" className="text-sm text-primary hover:underline">
            Retour au catalogue des services
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? "Modifier le service" : "Créer un service"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Mettez à jour les informations et la disponibilité du service."
            : "Configurez un service additionnel (assurance, options premium, équipements)."}
        </p>
      </div>
    </div>
  );
});

