import { memo } from "react";
import { Grid3x3, List, RefreshCcw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";

interface ClientsHeaderProps {
  totalClients: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetFilters: () => void;
}

export const ClientsHeader = memo(function ClientsHeader({
  totalClients,
  viewMode,
  onViewModeChange,
  onResetFilters,
}: ClientsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-sm text-muted-foreground">
          Suivez et segmentez vos clients ({totalClients} comptes enregistrés).
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-1 rounded-md border bg-white p-1 shadow-sm">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="sr-only">Vue grille</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Vue liste</span>
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onResetFilters}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
        <Button variant="default" size="sm" disabled>
          <UserPlus className="mr-2 h-4 w-4" />
          Nouveau client (bientôt)
        </Button>
      </div>
    </header>
  );
});

