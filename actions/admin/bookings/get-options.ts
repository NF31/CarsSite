"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ServicePricingType, UserRole, VehicleStatus } from "@prisma/client";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

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
  active: boolean;
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

export interface GetBookingOptionsParams {
  includeUserIds?: string[];
  includeServiceIds?: string[];
  includeLocationIds?: string[];
}

export async function getBookingOptionsAction(
  params: GetBookingOptionsParams = {}
): Promise<GetBookingOptionsResult> {
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

    // Générer une clé de cache basée sur les paramètres
    const cacheKey = `options:${JSON.stringify(params)}`;

    // Utiliser le cache Redis pour les options de réservation
    const data = await getOrSetCache(
      cacheKey,
      async () => {
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
          active: true,
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
      active: service.active,
    }));

    const includeUserIds = Array.from(new Set(params.includeUserIds ?? [])).filter(Boolean);
    const includeServiceIds = Array.from(new Set(params.includeServiceIds ?? [])).filter(Boolean);
    const includeLocationIds = Array.from(new Set(params.includeLocationIds ?? [])).filter(Boolean);

    if (includeUserIds.length > 0) {
      const existingUserIds = new Set(userOptions.map((user) => user.id));
      const missingUserIds = includeUserIds.filter((userId) => !existingUserIds.has(userId));

      if (missingUserIds.length > 0) {
        const extraUsers = await prisma.user.findMany({
          where: {
            id: {
              in: missingUserIds,
            },
          },
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
        });

        const mappedExtraUsers: BookingUserOption[] = extraUsers.map((user) => {
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

        userOptions.push(...mappedExtraUsers);
      }
    }

    if (includeServiceIds.length > 0) {
      const existingServiceIds = new Set(serviceOptions.map((service) => service.id));
      const missingServiceIds = includeServiceIds.filter(
        (serviceId) => !existingServiceIds.has(serviceId)
      );

      if (missingServiceIds.length > 0) {
        const extraServices = await prisma.service.findMany({
          where: {
            id: {
              in: missingServiceIds,
            },
          },
          select: {
            id: true,
            name: true,
            price: true,
            pricingType: true,
            active: true,
          },
        });

        const mappedExtraServices: BookingServiceOption[] = extraServices.map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          pricingType: service.pricingType,
          active: service.active,
        }));

        serviceOptions.push(...mappedExtraServices);
      }
    }

    if (includeLocationIds.length > 0) {
      const existingLocationIds = new Set(locationOptions.map((location) => location.id));
      const missingLocationIds = includeLocationIds.filter(
        (locationId) => !existingLocationIds.has(locationId)
      );

      if (missingLocationIds.length > 0) {
        const extraLocations = await prisma.location.findMany({
          where: {
            id: {
              in: missingLocationIds,
            },
          },
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        });

        const mappedExtraLocations: BookingLocationOption[] = extraLocations.map((location) => ({
          id: location.id,
          name: location.name,
          city: location.city,
          address: location.address,
        }));

          locationOptions.push(...mappedExtraLocations);
        }
      }

      userOptions.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      serviceOptions.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      locationOptions.sort((a, b) => {
        const cityComparison = a.city.localeCompare(b.city, "fr");
        if (cityComparison !== 0) {
          return cityComparison;
        }
        return a.name.localeCompare(b.name, "fr");
      });

      return {
        users: userOptions,
        vehicles: vehicleOptions,
        locations: locationOptions,
        services: serviceOptions,
      };
    },
    {
      prefix: CACHE_PREFIXES.BOOKING_OPTIONS,
      ttl: CACHE_TTL.BOOKING_OPTIONS,
    }
  );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Booking options error:", error);
    return {
      success: false,
      error: "Impossible de charger les données nécessaires à la création d'une réservation.",
    };
  }
}



