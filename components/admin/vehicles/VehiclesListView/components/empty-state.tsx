export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-gray-900">Aucun véhicule trouvé</p>
      <p className="text-sm text-muted-foreground mt-1">Essayez de modifier vos filtres de recherche</p>
    </div>
  );
}

