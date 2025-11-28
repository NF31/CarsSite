import { memo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, XAxis, YAxis, BarChart, Bar } from "recharts";
import type { WeekdayPoint } from "../StatisticsCharts";

interface WeekdayChartProps {
  data: WeekdayPoint[];
}

const weekdayConfig: ChartConfig = {
  count: {
    label: "Départs",
    color: "#f97316",
  },
};

export const WeekdayChart = memo(function WeekdayChart({ data }: WeekdayChartProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-3">
        <CardTitle>Départs de réservation par jour</CardTitle>
        <CardDescription>
          Volume de départs de réservations en fonction du jour de la semaine (basé sur la date de retrait).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={weekdayConfig} className="aspect-[16/6] w-full">
            <BarChart data={data} margin={{ left: 16, right: 16, bottom: 12 }}>
              <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      `${Number(value).toLocaleString("fr-FR")} départ${
                        Number(value) > 1 ? "s" : ""
                      }`
                    }
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 4, 4]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            Aucune réservation n&apos;a été enregistrée sur cette période.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

