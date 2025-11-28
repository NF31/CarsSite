import { memo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, XAxis, YAxis, BarChart, Bar } from "recharts";
import type { CategoryPoint } from "../StatisticsCharts";

interface CategoryChartProps {
  data: CategoryPoint[];
}

const categoryConfig: ChartConfig = {
  bookings: {
    label: "Réservations",
    color: "#0ea5e9",
  },
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const CategoryChart = memo(function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Par catégorie de véhicules</CardTitle>
        <CardDescription>
          Répartition des réservations en fonction de la catégorie du véhicule (revenu affiché dans l&apos;info-bulle).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={categoryConfig} className="aspect-[16/9] w-full">
            <BarChart data={data} margin={{ left: 16, right: 16, bottom: 12 }}>
              <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const revenue = item?.payload?.revenue ?? 0;
                      return (
                        <div className="flex flex-col gap-1">
                          <span>Réservations : {Number(value).toLocaleString("fr-FR")}</span>
                          <span className="text-muted-foreground">
                            Revenus : {currencyFormatter.format(revenue || 0)}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[8, 8, 4, 4]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            Aucune réservation sur cette période pour les catégories de véhicules.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

