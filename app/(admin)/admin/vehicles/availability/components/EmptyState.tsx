import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export const EmptyState = memo(function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-gray-900">Aucun véhicule trouvé</p>
          <p className="text-sm text-muted-foreground mt-1">
            Essayez de modifier vos filtres de recherche
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

