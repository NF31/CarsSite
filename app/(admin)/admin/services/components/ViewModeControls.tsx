import { memo } from "react";
import { Filter, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";

type ViewMode = "grid" | "list";

interface ViewModeControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeControls = memo(function ViewModeControls({
  viewMode,
  onViewModeChange,
}: ViewModeControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtres</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="icon"
          aria-label="Vue grille"
          onClick={() => onViewModeChange("grid")}
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="icon"
          aria-label="Vue liste"
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

