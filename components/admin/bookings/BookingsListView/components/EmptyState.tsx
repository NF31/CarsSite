import { ClipboardList } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-medium text-gray-900">Aucune réservation trouvée</p>
      <p className="text-sm text-muted-foreground mt-1">Essayez d&apos;ajuster vos filtres.</p>
    </div>
  );
}

