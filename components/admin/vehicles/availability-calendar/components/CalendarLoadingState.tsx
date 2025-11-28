import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const CalendarLoadingState = memo(function CalendarLoadingState() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </CardContent>
    </Card>
  );
});

