import { Clock } from "lucide-react";
import { memo } from "react";

interface OpeningHoursPreviewProps {
  hours: string[];
}

export const OpeningHoursPreview = memo(function OpeningHoursPreview({
  hours,
}: OpeningHoursPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
        <Clock className="h-4 w-4" />
        Horaires d&apos;ouverture
      </div>
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-3 text-sm">
        <ul className="space-y-1">
          {hours.map((line, index) => (
            <li key={`${line}-${index}`} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

