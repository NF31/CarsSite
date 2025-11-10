"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

const palette = [
  "#2563eb", // bleue
  "#16a34a", // verte
  "#f97316", // orange
  "#ec4899", // rose
  "#facc15", // jaune
];

export interface MonthlyPoint {
  month: string;
  bookings: number;
  revenue: number;
}

export interface StatusPoint {
  status: string;
  label: string;
  description: string;
  count: number;
}

export interface CategoryPoint {
  category: string;
  label: string;
  bookings: number;
  revenue: number;
}

export interface VehiclePoint {
  vehicleId: string;
  label: string;
  bookings: number;
  revenue: number;
}

export interface WeekdayPoint {
  weekday: number;
  label: string;
  count: number;
}

interface StatisticsChartsProps {
  monthlyData: MonthlyPoint[];
  statusData: StatusPoint[];
  totalBookings: number;
  categoryData: CategoryPoint[];
  topVehiclesData: VehiclePoint[];
  weekdayData: WeekdayPoint[];
}

export function StatisticsCharts({
  monthlyData,
  statusData,
  totalBookings,
  categoryData,
  topVehiclesData,
  weekdayData,
}: StatisticsChartsProps) {
  const statusConfig: ChartConfig = statusData.reduce(
    (acc, item, index) => {
      acc[item.status] = {
        label: item.label,
        color: palette[index % palette.length],
      };
      return acc;
    },
    {} as ChartConfig,
  );

  const statusChartData = statusData.map((item) => ({
    ...item,
    fill: `var(--color-${item.status})`,
  }));

  const bookingsConfig: ChartConfig = {
    bookings: {
      label: "Réservations",
      color: "#2563eb",
    },
  };

  const revenueConfig: ChartConfig = {
    revenue: {
      label: "Revenus",
      color: "#16a34a",
    },
  };

  const categoryConfig: ChartConfig = {
    bookings: {
      label: "Réservations",
      color: "#0ea5e9",
    },
  };

  const topVehicleConfig: ChartConfig = {
    revenue: {
      label: "Revenus",
      color: "#8b5cf6",
    },
  };

  const weekdayConfig: ChartConfig = {
    count: {
      label: "Départs",
      color: "#f97316",
    },
  };

  const maxStatus = Math.max(...statusChartData.map((item) => item.count), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Réservations mensuelles</CardTitle>
            <CardDescription>
              Nombre de réservations créées chaque mois sur les 12 derniers mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bookingsConfig} className="aspect-[16/9] w-full">
              <LineChart data={monthlyData} margin={{ left: 16, right: 16, bottom: 12 }}>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Revenus mensuels</CardTitle>
            <CardDescription>
              Revenus générés par les réservations confirmées ou terminées, mois par mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="aspect-[16/9] w-full">
              <BarChart data={monthlyData} margin={{ left: 16, right: 16, bottom: 12 }}>
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
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

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
            {statusData.map((status, index) => {
              const percentage =
                totalBookings > 0 ? (status.count / totalBookings) * 100 : 0;
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

      <div className="lg:col-span-3 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Par catégorie de véhicules</CardTitle>
            <CardDescription>
              Répartition des réservations en fonction de la catégorie du véhicule (revenu affiché dans l&apos;info-bulle).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ChartContainer config={categoryConfig} className="aspect-[16/9] w-full">
                <BarChart data={categoryData} margin={{ left: 16, right: 16, bottom: 12 }}>
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
                              <span>
                                Réservations : {Number(value).toLocaleString("fr-FR")}
                              </span>
                              <span className="text-muted-foreground">
                                Revenus :{" "}
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: "EUR",
                                  maximumFractionDigits: 0,
                                }).format(revenue || 0)}
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Top véhicules (revenus)</CardTitle>
            <CardDescription>
              Modèles qui ont généré le plus de revenus sur les 12 derniers mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topVehiclesData.length > 0 ? (
              <ChartContainer config={topVehicleConfig} className="w-full">
                <BarChart
                  data={topVehiclesData}
                  layout="vertical"
                  margin={{ left: 16, right: 16, bottom: 12, top: 16 }}
                >
                  <CartesianGrid strokeDasharray="4 4" className="stroke-border/50" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(Number(value))
                    }
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
                            <span>
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                                maximumFractionDigits: 0,
                              }).format(Number(value))}
                            </span>
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
      </div>

      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle>Départs de réservation par jour</CardTitle>
          <CardDescription>
            Volume de départs de réservations en fonction du jour de la semaine (basé sur la date de retrait).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weekdayData.length > 0 ? (
            <ChartContainer config={weekdayConfig} className="aspect-[16/6] w-full">
              <BarChart data={weekdayData} margin={{ left: 16, right: 16, bottom: 12 }}>
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
    </div>
  );
}

