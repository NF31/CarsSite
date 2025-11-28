import { memo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import type { StatusPoint } from "../StatisticsCharts";

const palette = [
  "#2563eb", // bleue
  "#16a34a", // verte
  "#f97316", // orange
  "#ec4899", // rose
  "#facc15", // jaune
];

interface StatusDistributionChartProps {
  data: StatusPoint[];
  totalBookings: number;
}

export const StatusDistributionChart = memo(function StatusDistributionChart({
  data,
  totalBookings,
}: StatusDistributionChartProps) {
  const statusConfig: ChartConfig = data.reduce(
    (acc, item, index) => {
      acc[item.status] = {
        label: item.label,
        color: palette[index % palette.length],
      };
      return acc;
    },
    {} as ChartConfig,
  );

  const statusChartData = data.map((item) => ({
    ...item,
    fill: `var(--color-${item.status})`,
  }));

  const maxStatus = Math.max(...statusChartData.map((item) => item.count), 1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Répartition des statuts</CardTitle>
        <CardDescription>
          Volume de réservations par statut sur les 12 derniers mois. Le cercle central indique le total.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative w-full max-w-[360px]">
          <ChartContainer
            config={statusConfig}
            className="mx-auto aspect-square w-full max-w-[360px] justify-center"
          >
            <RadialBarChart
              data={statusChartData}
              startAngle={90}
              endAngle={-270}
              innerRadius={60}
              outerRadius={130}
            >
              <PolarAngleAxis type="number" domain={[0, maxStatus]} tick={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    nameKey="label"
                    formatter={(value, name) => `${name} : ${Number(value).toLocaleString("fr-FR")}`}
                  />
                }
              />
              <RadialBar dataKey="count" background cornerRadius={12} />
            </RadialBarChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Réservations
            </span>
            <span className="text-3xl font-semibold text-foreground">
              {totalBookings.toLocaleString("fr-FR")}
            </span>
          </div>
        </div>

        <ul className="w-full space-y-2">
          {data.map((status, index) => {
            const percentage = totalBookings > 0 ? (status.count / totalBookings) * 100 : 0;
            const color = palette[index % palette.length];

            return (
              <li
                key={status.status}
                className="grid gap-1 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-foreground">{status.label}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {percentage.toFixed(1)} %
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{status.description}</span>
                  <span className="font-medium text-foreground">
                    {status.count.toLocaleString("fr-FR")}
                  </span>
                </div>
              </li>
            );
          })}
          {totalBookings === 0 && (
            <li className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              Aucune réservation enregistrée sur la période sélectionnée.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
});

