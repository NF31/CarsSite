"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  BookingStatus,
  ServicePricingType,
  UserRole,
  VehicleStatus,
} from "@prisma/client";
import { extractCloudinaryAssetInfo } from "@/lib/cloudinary-utils";

export interface BookingDetailService {
  id: string;
  name: string;
  price: number;
  pricingType: ServicePricingType;
  active: boolean;
}

export interface BookingDetailUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  hasDriverLicense: boolean;
  driverLicenseUrl: string | null;
  driverLicensePublicId: string | null;
  driverLicenseUploadCount: number;
  driverLicenseLastUploadedAt: string | null;
  deletedAt: string | null;
}

export interface BookingDetailLocation {
  id: string;
  name: string;
  city: string;
  address: string | null;
}

export interface BookingDetailVehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  status: VehicleStatus;
  pricePerDay: number;
  deposit: number;
  location: {
    id: string;
    name: string;
    city: string;
  } | null;
}

export interface BookingDetail {
  id: string;
  reference: string;
  status: BookingStatus;
  userId: string;
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  serviceIds: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: BookingDetailUser;
  vehicle: BookingDetailVehicle;
  pickupLocation: BookingDetailLocation;
  returnLocation: BookingDetailLocation;
  services: BookingDetailService[];
}

export interface GetBookingResult {
  success: boolean;
  data?: BookingDetail;
  error?: string;
  status?: number;
}

export async function getBookingByIdAction(id: string): Promise<GetBookingResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour consulter cette réservation.",
        status: 403,
      };
    }

    const bookingId = typeof id === "string" ? id.trim() : "";

    if (!bookingId) {
      return {
        success: false,
        error: "Identifiant de réservation invalide.",
        status: 400,
      };
    }

    // Utiliser le cache Redis pour les détails d'une réservation
    const { getOrSetCache, CACHE_PREFIXES, CACHE_TTL } = await import("@/lib/cache");
    
    const booking = await getOrSetCache(
      bookingId,
      async () => {
        return await prisma.booking.findUnique({
          where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        status: true,
        userId: true,
        vehicleId: true,
        pickupLocationId: true,
        returnLocationId: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        serviceIds: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
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
            deletedAt: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            status: true,
            pricePerDay: true,
            deposit: true,
            location: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        pickupLocation: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
        returnLocation: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },
      },
    });
      },
      {
        prefix: CACHE_PREFIXES.BOOKING,
        ttl: CACHE_TTL.BOOKING,
      }
    );

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
        status: 404,
      };
    }

    const services =
      booking.serviceIds.length > 0
        ? await prisma.service.findMany({
            where: { id: { in: booking.serviceIds } },
            select: {
              id: true,
              name: true,
              price: true,
              pricingType: true,
              active: true,
            },
          })
        : [];

    const userAsset = extractCloudinaryAssetInfo(booking.user.driverLicense ?? undefined);
    const explicitPublicId = booking.user.driverLicensePublicId ?? null;
    const fallbackPublicId = userAsset ? `${userAsset.publicId}.${userAsset.format}` : null;

    const detail: BookingDetail = {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      userId: booking.userId,
      vehicleId: booking.vehicleId,
      pickupLocationId: booking.pickupLocationId,
      returnLocationId: booking.returnLocationId,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalPrice: booking.totalPrice,
      depositPaid: booking.depositPaid,
      remainingAmount: booking.remainingAmount,
      serviceIds: booking.serviceIds,
      notes: booking.notes ?? null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      user: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone,
        role: booking.user.role,
        hasDriverLicense: Boolean(booking.user.driverLicense),
        driverLicenseUrl: booking.user.driverLicense ?? null,
        driverLicensePublicId: explicitPublicId ?? fallbackPublicId,
        driverLicenseUploadCount: booking.user.driverLicenseUploadCount ?? 0,
        driverLicenseLastUploadedAt: booking.user.driverLicenseLastUploadedAt
          ? booking.user.driverLicenseLastUploadedAt.toISOString()
          : null,
        deletedAt: booking.user.deletedAt ? booking.user.deletedAt.toISOString() : null,
      },
      vehicle: {
        id: booking.vehicle.id,
        brand: booking.vehicle.brand,
        model: booking.vehicle.model,
        licensePlate: booking.vehicle.licensePlate,
        status: booking.vehicle.status,
        pricePerDay: booking.vehicle.pricePerDay,
        deposit: booking.vehicle.deposit,
        location: booking.vehicle.location
          ? {
              id: booking.vehicle.location.id,
              name: booking.vehicle.location.name,
              city: booking.vehicle.location.city,
            }
          : null,
      },
      pickupLocation: {
        id: booking.pickupLocation.id,
        name: booking.pickupLocation.name,
        city: booking.pickupLocation.city,
        address: booking.pickupLocation.address ?? null,
      },
      returnLocation: {
        id: booking.returnLocation.id,
        name: booking.returnLocation.name,
        city: booking.returnLocation.city,
        address: booking.returnLocation.address ?? null,
      },
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        pricingType: service.pricingType,
        active: service.active,
      })),
    };

    return {
      success: true,
      data: detail,
    };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération de la réservation.",
      status: 500,
    };
  }
}


