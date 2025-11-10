"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export interface RevenuePoint {
  date: string;
  label: string;
  revenue: number;
}

interface DashboardRevenueChartProps {
  data: RevenuePoint[];
  total: number;
  average: number;
}

const revenueConfig: ChartConfig = {
  revenue: {
    label: "Revenus",
    color: "#2563eb",
  },
};

export function DashboardRevenueChart({ data, total, average }: DashboardRevenueChartProps) {
  const totalFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(total);

  const averageFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(average);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Revenus sur 30 jours</CardTitle>
          <CardDescription>Évolution quotidienne des revenus encaissés</CardDescription>
        </div>
        <div className="flex flex-col items-start gap-1 text-sm text-muted-foreground lg:items-end">
          <span>
            Total&nbsp;: <span className="font-semibold text-foreground">{totalFormatted}</span>
          </span>
          <span>
            Moyenne journalière&nbsp;:{" "}
            <span className="font-semibold text-foreground">{averageFormatted}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" className="stroke-border/60" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(value) =>
                new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(Number(value))
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(Number(value))
                  }
                  labelFormatter={(label) => <span className="capitalize">{label}</span>}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

