import { memo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, XAxis, YAxis, BarChart, Bar } from "recharts";
import type { VehiclePoint } from "../StatisticsCharts";

interface TopVehiclesChartProps {
  data: VehiclePoint[];
}

const topVehicleConfig: ChartConfig = {
  revenue: {
    label: "Revenus",
    color: "#8b5cf6",
  },
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const TopVehiclesChart = memo(function TopVehiclesChart({ data }: TopVehiclesChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Top véhicules (revenus)</CardTitle>
        <CardDescription>
          Modèles qui ont généré le plus de revenus sur les 12 derniers mois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={topVehicleConfig} className="w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 16, right: 16, bottom: 12, top: 16 }}
            >
              <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => currencyFormatter.format(Number(value))}
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={160}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-1">
                        <span>{currencyFormatter.format(Number(value))}</span>
                        <span className="text-muted-foreground">
                          Réservations : {item?.payload?.bookings?.toLocaleString("fr-FR") ?? 0}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            Aucun véhicule n&apos;est ressorti sur cette période.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

