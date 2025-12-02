import { memo } from "react";

export const EmptyState = memo(function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-muted-foreground">
      Vos réservations récentes apparaîtront ici.
    </div>
  );
});

