import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export const EmptyState = memo(function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="px-6 py-12 text-center">
        <p className="text-lg font-medium text-gray-900">Aucun service trouvé</p>
        <p className="text-sm text-muted-foreground mt-2">
          Ajustez vos filtres ou créez un nouveau service pour enrichir votre catalogue.
        </p>
      </CardContent>
    </Card>
  );
});

