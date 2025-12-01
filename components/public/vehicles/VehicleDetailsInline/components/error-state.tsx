type ErrorStateProps = {
  error?: string | null;
};

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || "Véhicule introuvable"}</p>
      </div>
    </div>
  );
}

