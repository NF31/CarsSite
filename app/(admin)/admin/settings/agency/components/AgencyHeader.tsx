import { Building2, RefreshCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface AgencyHeaderProps {
  onReset: () => void;
  isPending: boolean;
}

export const AgencyHeader = memo(function AgencyHeader({
  onReset,
  isPending,
}: AgencyHeaderProps) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Informations de l&apos;agence</h1>
            <p className="text-sm text-muted-foreground">
              Gérez l&apos;identité et les coordonnées diffusées sur vos supports clients.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isPending}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button type="submit" form="agency-settings-form" disabled={isPending} className="gap-2">
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>
    </header>
  );
});

