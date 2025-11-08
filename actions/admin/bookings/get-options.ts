"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma, ServicePricingType, UserRole, VehicleStatus } from "@prisma/client";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";

export interface BookingUserOption {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  totalBookings: number;
  hasDriverLicense: boolean;
  driverLicenseUrl: string | null;
  driverLicensePublicId: string | null;
  driverLicenseUploadCount: number;
  driverLicenseLastUploadedAt: string | null;
}

export interface BookingVehicleOption {
  id: string;
  label: string;
  brand: string;
  model: string;
  licensePlate: string;
  pricePerDay: number;
  deposit: number;
  status: VehicleStatus;
  location?: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export interface BookingLocationOption {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface BookingServiceOption {
  id: string;
  name: string;
  price: number;
  pricingType: ServicePricingType;
}

export interface GetBookingOptionsResult {
  success: boolean;
  data?: {
    users: BookingUserOption[];
    vehicles: BookingVehicleOption[];
    locations: BookingLocationOption[];
    services: BookingServiceOption[];
  };
  error?: string;
}

export async function getBookingOptionsAction(): Promise<GetBookingOptionsResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour créer une réservation.",
      };
    }

    const [users, vehicles, locations, services] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          role: {
            in: [UserRole.CLIENT, UserRole.EMPLOYEE],
          },
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          driverLicense: true,
          driverLicensePublicId: true,
          driverLicenseUploadCount: true,
          driverLicenseLastUploadedAt: true,
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      prisma.vehicle.findMany({
        orderBy: [
          {
            brand: "asc",
          },
          {
            model: "asc",
          },
        ],
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          licensePlate: true,
          pricePerDay: true,
          deposit: true,
          status: true,
          location: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      }),
      prisma.location.findMany({
        where: { active: true },
        orderBy: [
          {
            city: "asc",
          },
          {
            name: "asc",
          },
        ],
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
        },
      }),
      prisma.service.findMany({
        where: {
          active: true,
        },
        orderBy: [
          {
            name: "asc",
          },
        ],
        select: {
          id: true,
          name: true,
          price: true,
          pricingType: true,
        },
      }),
    ]);

    const userOptions: BookingUserOption[] = users.map((user) => {
      const assetInfo = extractCloudinaryAssetInfo(user.driverLicense ?? undefined);
      const explicitPublicId = user.driverLicensePublicId ?? null;
      const fallbackPublicId = assetInfo ? `${assetInfo.publicId}.${assetInfo.format}` : null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        totalBookings: user._count.bookings,
        hasDriverLicense: Boolean(user.driverLicense),
        driverLicenseUrl: user.driverLicense ?? null,
        driverLicensePublicId: explicitPublicId ?? fallbackPublicId,
        driverLicenseUploadCount: user.driverLicenseUploadCount ?? 0,
        driverLicenseLastUploadedAt: user.driverLicenseLastUploadedAt
          ? user.driverLicenseLastUploadedAt.toISOString()
          : null,
      };
    });

    const vehicleOptions: BookingVehicleOption[] = vehicles.map((vehicle) => ({
      id: vehicle.id,
      label: `${vehicle.brand} ${vehicle.model} • ${vehicle.licensePlate}`,
      brand: vehicle.brand,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      pricePerDay: vehicle.pricePerDay,
      deposit: vehicle.deposit,
      status: vehicle.status,
      location: vehicle.location
        ? {
            id: vehicle.location.id,
            name: vehicle.location.name,
            city: vehicle.location.city,
          }
        : null,
    }));

    const locationOptions: BookingLocationOption[] = locations.map((location) => ({
      id: location.id,
      name: location.name,
      city: location.city,
      address: location.address,
    }));

    const serviceOptions: BookingServiceOption[] = services.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      pricingType: service.pricingType,
    }));

    return {
      success: true,
      data: {
        users: userOptions,
        vehicles: vehicleOptions,
        locations: locationOptions,
        services: serviceOptions,
      },
    };
  } catch (error) {
    console.error("Booking options error:", error);
    return {
      success: false,
      error: "Impossible de charger les données nécessaires à la création d'une réservation.",
    };
  }
}



