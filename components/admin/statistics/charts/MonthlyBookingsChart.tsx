import { memo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from "recharts";
import type { MonthlyPoint } from "../StatisticsCharts";

interface MonthlyBookingsChartProps {
  data: MonthlyPoint[];
}

const bookingsConfig: ChartConfig = {
  bookings: {
    label: "Réservations",
    color: "#2563eb",
  },
};

export const MonthlyBookingsChart = memo(function MonthlyBookingsChart({
  data,
}: MonthlyBookingsChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Réservations mensuelles</CardTitle>
        <CardDescription>
          Nombre de réservations créées chaque mois sur les 12 derniers mois.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={bookingsConfig} className="aspect-[16/9] w-full">
          <LineChart data={data} margin={{ left: 16, right: 16, bottom: 12 }}>
            <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toString()}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => <span className="capitalize">{label}</span>}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="var(--color-bookings)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

