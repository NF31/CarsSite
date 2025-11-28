"use client";

import { memo } from "react";
import {
  MonthlyBookingsChart,
  MonthlyRevenueChart,
  StatusDistributionChart,
  CategoryChart,
  TopVehiclesChart,
  WeekdayChart,
} from "./charts";

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

function StatisticsChartsComponent({
  monthlyData,
  statusData,
  totalBookings,
  categoryData,
  topVehiclesData,
  weekdayData,
}: StatisticsChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <MonthlyBookingsChart data={monthlyData} />
        <MonthlyRevenueChart data={monthlyData} />
      </div>

      <StatusDistributionChart data={statusData} totalBookings={totalBookings} />

      <div className="lg:col-span-3 grid gap-6 lg:grid-cols-2">
        <CategoryChart data={categoryData} />
        <TopVehiclesChart data={topVehiclesData} />
      </div>

      <WeekdayChart data={weekdayData} />
    </div>
  );
}

export const StatisticsCharts = memo(StatisticsChartsComponent);

