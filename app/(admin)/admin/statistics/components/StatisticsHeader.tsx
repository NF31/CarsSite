import { memo } from "react";

export const StatisticsHeader = memo(function StatisticsHeader() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
      <p className="text-gray-600">
        Visualisez l&apos;activité des 12 derniers mois et surveillez les indicateurs clés.
      </p>
    </div>
  );
});

