import dynamic from "next/dynamic";
import { CalendarPageHeader, CalendarStatsCards } from "@/components/admin/bookings/calendar";
import { getCalendarStatsAction, getCalendarInitialDataAction } from "@/actions/admin/bookings";

// Lazy load BookingsCalendar (FullCalendar est lourd)
const BookingsCalendar = dynamic(
  () => import("@/components/admin/bookings").then((mod) => ({ default: mod.BookingsCalendar })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement du calendrier...</p>
        </div>
      </div>
    ),
  }
);

export default async function AdminBookingsCalendarPage() {
  const now = new Date();
  const currentMonthName = now.toLocaleString("fr-FR", { month: "long" });

  const [stats, initialData] = await Promise.all([
    getCalendarStatsAction(now),
    getCalendarInitialDataAction(),
  ]);

  return (
    <div className="space-y-6">
      <CalendarPageHeader />

      <CalendarStatsCards
        totalBookings={stats.totalBookings}
        activeBookings={stats.activeBookings}
        upcomingBookings={stats.upcomingBookings}
        completedThisMonth={stats.completedThisMonth}
        cancelledThisMonth={stats.cancelledThisMonth}
        currentMonthName={currentMonthName}
      />

      <BookingsCalendar initialRange={initialData.initialRange} initialEvents={initialData.initialEvents} />
    </div>
  );
}
