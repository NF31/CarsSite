import { StickyNote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CostAndNotesInputsProps {
  cost: string;
  notes: string;
  onCostChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  isPending: boolean;
  hasEnded: boolean;
  costError?: string[];
}

export function CostAndNotesInputs({
  cost,
  notes,
  onCostChange,
  onNotesChange,
  isPending,
  hasEnded,
  costError,
}: CostAndNotesInputsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="maintenance-cost">Coût estimé</Label>
        <Input
          id="maintenance-cost"
          type="number"
          step="0.01"
          min="0"
          value={cost}
          onChange={(event) => onCostChange(event.target.value)}
          disabled={isPending || hasEnded}
          className="w-full"
        />
        {costError && <p className="text-xs text-red-500">{costError[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="maintenance-notes" className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          Notes internes
        </Label>
        <Textarea
          id="maintenance-notes"
          rows={3}
          placeholder="Informations internes, pièces commandées, suivi..."
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          disabled={isPending || hasEnded}
          className="w-full"
        />
      </div>
    </div>
  );
}

