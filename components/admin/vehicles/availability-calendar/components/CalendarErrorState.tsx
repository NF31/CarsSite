import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface CalendarErrorStateProps {
  error: string;
}

export const CalendarErrorState = memo(function CalendarErrorState({
  error,
}: CalendarErrorStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
});

