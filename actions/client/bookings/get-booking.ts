"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export interface ClientBookingDetail {
  id: string;
  reference: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositPaid: number;
  remainingAmount: number;
  securityDepositPaid: number | null;
  serviceIds: string[];
  notes: string | null;
  cancellationRequested: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    seats: number;
    transmission: string;
    fuelType: string;
    pricePerDay: number;
    deposit: number;
    images: string[];
  };
  pickupLocation: {
    id: string;
    name: string;
    city: string;
    address: string | null;
  };
  returnLocation: {
    id: string;
    name: string;
    city: string;
    address: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    pricingType: string;
  }>;
}

export interface GetClientBookingResult {
  success: boolean;
  data?: ClientBookingDetail;
  error?: string;
}

/**
 * Récupère les détails d'une réservation pour un client
 */
export async function getClientBookingByIdAction(
  bookingId: string
): Promise<GetClientBookingResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: "Vous devez être connecté pour voir cette réservation.",
      };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        status: true,
        userId: true,
        startDate: true,
        endDate: true,
        totalPrice: true,
        depositPaid: true,
        remainingAmount: true,
        securityDepositPaid: true,
        serviceIds: true,
        notes: true,
        cancellationRequested: true,
        cancellationReason: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            licensePlate: true,
            seats: true,
            transmission: true,
            fuelType: true,
            pricePerDay: true,
            deposit: true,
            images: true,
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

    if (!booking) {
      return {
        success: false,
        error: "Réservation introuvable.",
      };
    }

    // Vérifier que la réservation appartient à l'utilisateur connecté
    if (booking.userId !== session.user.id) {
      return {
        success: false,
        error: "Vous n'êtes pas autorisé à voir cette réservation.",
      };
    }

    // Récupérer les services
    const services = booking.serviceIds.length > 0
      ? await prisma.service.findMany({
          where: {
            id: { in: booking.serviceIds },
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            pricingType: true,
          },
        })
      : [];

    const detail: ClientBookingDetail = {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalPrice: booking.totalPrice,
      depositPaid: booking.depositPaid,
      remainingAmount: booking.remainingAmount,
      securityDepositPaid: booking.securityDepositPaid,
      serviceIds: booking.serviceIds,
      notes: booking.notes,
      cancellationRequested: booking.cancellationRequested,
      cancellationReason: booking.cancellationReason,
      cancelledAt: booking.cancelledAt?.toISOString() || null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      vehicle: {
        id: booking.vehicle.id,
        brand: booking.vehicle.brand,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        licensePlate: booking.vehicle.licensePlate,
        seats: booking.vehicle.seats,
        transmission: booking.vehicle.transmission,
        fuelType: booking.vehicle.fuelType,
        pricePerDay: booking.vehicle.pricePerDay,
        deposit: booking.vehicle.deposit,
        images: booking.vehicle.images,
      },
      pickupLocation: {
        id: booking.pickupLocation.id,
        name: booking.pickupLocation.name,
        city: booking.pickupLocation.city,
        address: booking.pickupLocation.address,
      },
      returnLocation: {
        id: booking.returnLocation.id,
        name: booking.returnLocation.name,
        city: booking.returnLocation.city,
        address: booking.returnLocation.address,
      },
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        pricingType: service.pricingType,
      })),
    };

    return {
      success: true,
      data: detail,
    };
  } catch (error) {
    console.error("[Client Booking] Erreur lors de la récupération des détails:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération de la réservation.",
    };
  }
}

