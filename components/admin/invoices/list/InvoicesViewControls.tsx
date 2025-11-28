import { memo } from "react";
import { Filter, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 40];

interface InvoicesViewControlsProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: string) => void;
  filteredCount: number;
  totalItems: number;
  displayedCount: number;
}

export const InvoicesViewControls = memo(function InvoicesViewControls({
  viewMode,
  onViewModeChange,
  itemsPerPage,
  onItemsPerPageChange,
  filteredCount,
  totalItems,
  displayedCount,
}: InvoicesViewControlsProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>
              {filteredCount} facture{filteredCount > 1 ? "s" : ""} trouvée{filteredCount > 1 ? "s" : ""}
            </span>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {displayedCount} élément{displayedCount > 1 ? "s" : ""} affiché{displayedCount > 1 ? "s" : ""} sur {totalItems}
          </p>
          <Select value={itemsPerPage.toString()} onValueChange={onItemsPerPageChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="10 par page" />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
});

