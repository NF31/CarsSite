import { memo } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SearchEmptyStateProps {
  hasQuery: boolean;
  query?: string;
}

export const SearchEmptyState = memo(function SearchEmptyState({
  hasQuery,
  query,
}: SearchEmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {hasQuery
              ? `Aucun résultat trouvé pour "${query}"`
              : "Utilisez la barre de recherche en haut pour rechercher"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

