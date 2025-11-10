"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart } from "recharts";

export interface FleetSegment {
  key: "available" | "reserved" | "maintenance";
  label: string;
  value: number;
}

interface DashboardFleetDistributionChartProps {
  data: FleetSegment[];
  totalVehicles: number;
  occupancyRate: number;
}

const fleetConfig: ChartConfig = {
  available: {
    label: "Disponible",
    color: "#16a34a",
  },
  reserved: {
    label: "Réservé",
    color: "#2563eb",
  },
  maintenance: {
    label: "Maintenance",
    color: "#f97316",
  },
};

export function DashboardFleetDistributionChart({
  data,
  totalVehicles,
  occupancyRate,
}: DashboardFleetDistributionChartProps) {
  const totalFormatted = new Intl.NumberFormat("fr-FR").format(totalVehicles);
  const occupiedVehicles = data.find((item) => item.key === "reserved")?.value ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux d&apos;occupation</CardTitle>
        <CardDescription>Répartition des véhicules par statut</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ChartContainer config={fleetConfig} className="mx-auto aspect-square max-w-[280px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    `${new Intl.NumberFormat("fr-FR").format(Number(value))} ${name}`
                  }
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={60}
              outerRadius={110}
              strokeWidth={6}
              paddingAngle={4}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
            >
              <tspan className="text-2xl font-semibold">{occupancyRate}%</tspan>
              <tspan x="50%" dy="1.4em" className="fill-muted-foreground text-xs">
                Occupation
              </tspan>
            </text>
            <ChartLegend
              verticalAlign="bottom"
              content={<ChartLegendContent className="text-xs" />}
            />
          </PieChart>
        </ChartContainer>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Véhicules occupés</span>
            <span className="font-semibold">{new Intl.NumberFormat("fr-FR").format(occupiedVehicles)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total flotte</span>
            <span className="font-semibold">{totalFormatted}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

