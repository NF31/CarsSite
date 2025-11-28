import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

export const LoadingState = memo(function LoadingState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Chargement des véhicules...</p>
        </div>
      </CardContent>
    </Card>
  );
});

