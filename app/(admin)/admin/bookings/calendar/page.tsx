import { prisma } from "@/lib/prisma";
import { BookingsCalendar } from "@/components/admin/bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatus } from "@prisma/client";
import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { mapBookingToCalendarEvent } from "@/actions/admin/bookings";

export const metadata = {
  title: "Calendrier des réservations - Administration",
  description:
    "Visualisez les réservations en cours, à venir et terminées directement dans un calendrier interactif.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminBookingsCalendarPage() {
  const now = new Date();
  const start = startOfMonth(subMonths(now, 1));
  const end = endOfMonth(addMonths(now, 2));
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [totalBookings, activeBookings, upcomingBookings, completedThisMonth, cancelledThisMonth] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: {
            not: BookingStatus.CANCELLED,
          },
          startDate: {
            lte: now,
          },
          endDate: {
            gt: now,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
          startDate: {
            gt: now,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: {
            not: BookingStatus.CANCELLED,
          },
          endDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: BookingStatus.CANCELLED,
          updatedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ]);

  const initialRange = {
    start: start.toISOString(),
    end: end.toISOString(),
  };

  const initialBookings = await prisma.booking.findMany({
    where: {
      startDate: {
        lte: end,
      },
      endDate: {
        gte: start,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          licensePlate: true,
        },
      },
      pickupLocation: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      returnLocation: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  const initialEvents = initialBookings.map(mapBookingToCalendarEvent);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Calendrier des réservations</h1>
        <p className="text-gray-600">
          Consultez l&apos;occupation de la flotte en temps réel, identifiez les périodes chargées et
          accédez aux détails clients d&apos;un simple clic.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Réservations enregistrées</CardDescription>
            <CardTitle className="text-2xl">{totalBookings.toLocaleString("fr-FR")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Total cumulé depuis l&apos;ouverture de l&apos;administration.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En cours aujourd&apos;hui</CardDescription>
            <CardTitle className="text-2xl">{activeBookings.toLocaleString("fr-FR")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Réservations actives (véhicule actuellement loué).
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>À venir</CardDescription>
            <CardTitle className="text-2xl">{upcomingBookings.toLocaleString("fr-FR")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Réservations confirmées ou en attente dont le départ n&apos;est pas encore passé.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ce mois-ci</CardDescription>
            <CardTitle className="text-2xl">
              {completedThisMonth.toLocaleString("fr-FR")} terminé{completedThisMonth > 1 ? "es" : ""}{" "}
              / {cancelledThisMonth.toLocaleString("fr-FR")} annulé{cancelledThisMonth > 1 ? "es" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Bilan des réservations clôturées et annulées depuis le 1er {now.toLocaleString("fr-FR", { month: "long" })}.
          </CardContent>
        </Card>
      </div>

      <BookingsCalendar initialRange={initialRange} initialEvents={initialEvents} />
    </div>
  );
}
