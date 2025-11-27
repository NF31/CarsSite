import { BookingsCalendar } from "@/components/admin/bookings";
import { CalendarPageHeader, CalendarStatsCards } from "@/components/admin/bookings/calendar";
import { getCalendarStatsAction, getCalendarInitialDataAction } from "@/actions/admin/bookings";

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
