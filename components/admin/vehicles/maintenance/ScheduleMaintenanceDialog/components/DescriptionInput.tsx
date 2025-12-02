import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionInputProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  isPending: boolean;
  hasEnded: boolean;
}

export function DescriptionInput({
  description,
  onDescriptionChange,
  isPending,
  hasEnded,
}: DescriptionInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="maintenance-description">Description</Label>
      <Textarea
        id="maintenance-description"
        rows={4}
        placeholder="Détails visibles par les autres administrateurs (travaux, prestataire, etc.)"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        disabled={isPending || hasEnded}
        className="w-full"
      />
    </div>
  );
}

