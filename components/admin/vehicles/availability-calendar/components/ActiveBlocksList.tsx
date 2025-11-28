import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Unlock } from "lucide-react";
import { format } from "date-fns";

interface ActiveBlocksListProps {
  blocks: Array<{
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    description?: string | null;
  }>;
  onUnblock: (block: {
    id: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
  }) => void;
}

export const ActiveBlocksList = memo(function ActiveBlocksList({
  blocks,
  onUnblock,
}: ActiveBlocksListProps) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
      <p className="text-sm font-medium text-amber-800">
        Dates actuellement bloquées ({blocks.length}) :
      </p>
      <div className="space-y-2">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2"
          >
            <div className="text-sm text-amber-900 space-y-1">
              <p>
                <span className="font-semibold">Du :</span>{" "}
                {format(new Date(block.startDate), "dd/MM/yyyy HH:mm")}
              </p>
              <p>
                <span className="font-semibold">Au :</span>{" "}
                {format(new Date(block.endDate), "dd/MM/yyyy HH:mm")}
              </p>
              {block.description && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Raison :</span> {block.description}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                onUnblock({
                  id: block.id,
                  startDate: new Date(block.startDate),
                  endDate: new Date(block.endDate),
                  reason: block.description || null,
                });
              }}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Débloquer
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

