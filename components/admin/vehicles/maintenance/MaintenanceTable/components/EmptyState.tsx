import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="border border-dashed border-gray-200 shadow-none bg-white">
      <div className="p-10 flex flex-col items-center text-center gap-3 text-muted-foreground">
        <ClipboardList className="h-10 w-10" />
        <p className="font-semibold text-gray-900">
          Aucune maintenance trouvée avec les filtres actuels
        </p>
        <p className="text-sm">
          Ajustez vos filtres ou planifiez une nouvelle intervention pour un véhicule.
        </p>
      </div>
    </Card>
  );
}

