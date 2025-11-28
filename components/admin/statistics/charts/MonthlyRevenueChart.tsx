import { memo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, XAxis, YAxis, BarChart, Bar } from "recharts";
import type { MonthlyPoint } from "../StatisticsCharts";

interface MonthlyRevenueChartProps {
  data: MonthlyPoint[];
}

const revenueConfig: ChartConfig = {
  revenue: {
    label: "Revenus",
    color: "#16a34a",
  },
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const MonthlyRevenueChart = memo(function MonthlyRevenueChart({
  data,
}: MonthlyRevenueChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Revenus mensuels</CardTitle>
        <CardDescription>
          Revenus générés par les réservations confirmées ou terminées, mois par mois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueConfig} className="aspect-[16/9] w-full">
          <BarChart data={data} margin={{ left: 16, right: 16, bottom: 12 }}>
            <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => currencyFormatter.format(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => currencyFormatter.format(Number(value))}
                  labelFormatter={(label) => <span className="capitalize">{label}</span>}
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[10, 10, 4, 4]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

