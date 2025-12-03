import type { ClientListItem, ClientStatus } from "./types";
import type { BookingStatus } from "@prisma/client";

interface PrismaClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  lockedUntil: Date | null;
  driverLicense: string | null;
  bookings: Array<{
    id: string;
    startDate: Date;
    endDate: Date | null;
    status: BookingStatus;
    vehicle: {
      id: string;
      brand: string;
      model: string;
      licensePlate: string;
    } | null;
  }>;
  _count: {
    bookings: number;
  };
}

export function mapClients(clients: PrismaClient[], now: Date): ClientListItem[] {
  return clients.map((client) => {
    const lastBooking = client.bookings[0];
    let status: ClientStatus = "ACTIVE";

    if (client.deletedAt) {
      status = "INACTIVE";
    } else if (client.lockedUntil && client.lockedUntil > now) {
      status = "LOCKED";
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdAt.toISOString(),
      status,
      bookingsCount: client._count.bookings,
      hasDriverLicense: Boolean(client.driverLicense),
      driverLicenseUrl: client.driverLicense ?? null,
      lockedUntil: client.lockedUntil ? client.lockedUntil.toISOString() : null,
      deletedAt: client.deletedAt ? client.deletedAt.toISOString() : null,
      lastBooking: lastBooking
        ? {
            id: lastBooking.id,
            startDate: lastBooking.startDate.toISOString(),
            endDate: lastBooking.endDate ? lastBooking.endDate.toISOString() : null,
            status: lastBooking.status,
            vehicle: lastBooking.vehicle
              ? {
                  id: lastBooking.vehicle.id,
                  brand: lastBooking.vehicle.brand,
                  model: lastBooking.vehicle.model,
                  licensePlate: lastBooking.vehicle.licensePlate,
                }
              : null,
          }
        : null,
    };
  });
}

