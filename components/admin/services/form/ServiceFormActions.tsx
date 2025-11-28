import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ServiceFormActionsProps {
  isPending: boolean;
  isEditMode: boolean;
}

export const ServiceFormActions = memo(function ServiceFormActions({
  isPending,
  isEditMode,
}: ServiceFormActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
      <Button type="button" variant="outline" asChild disabled={isPending}>
        <Link href="/admin/services">Annuler</Link>
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? isEditMode
            ? "Mise à jour en cours..."
            : "Création en cours..."
          : isEditMode
            ? "Mettre à jour le service"
            : "Enregistrer le service"}
      </Button>
    </div>
  );
});

