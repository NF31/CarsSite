import prisma from "@/lib/prisma";

export async function loadReservationsData(userId: string) {
  const [bookings, cancellationPolicySetting] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
        pickupLocation: {
          select: {
            name: true,
            city: true,
            address: true,
          },
        },
        returnLocation: {
          select: {
            name: true,
            city: true,
            address: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
          },
          orderBy: {
            issuedAt: "desc",
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    }),
    prisma.setting.findUnique({
      where: { key: "config.cancellationPolicy" },
      select: { value: true },
    }),
  ]);

  return { bookings, cancellationPolicySetting };
}

export async function loadServicesForReservations(bookings: Array<{ serviceIds: string[] }>) {
  const allServiceIds = new Set<string>();
  bookings.forEach((booking) => {
    booking.serviceIds.forEach((id) => allServiceIds.add(id));
  });

  const servicesMap = new Map<string, { id: string; name: string; price: number }>();
  if (allServiceIds.size > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: Array.from(allServiceIds),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });
    services.forEach((service) => {
      servicesMap.set(service.id, service);
    });
  }

  return servicesMap;
}

