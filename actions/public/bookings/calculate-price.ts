"use server";

import { getPublicVehicleByIdAction } from "../vehicles/get-by-id";
import { getPublicServicesAction } from "./get-services";

export interface CalculatePriceInput {
  vehicleId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  serviceIds?: string[];
}

export interface CalculatePriceResult {
  success: boolean;
  data?: {
    vehiclePrice: number;
    servicesPrice: number;
    totalPrice: number; // Total de la location (véhicule + services)
    deposit: number; // Acompte sur la location (30% du total) - pour compatibilité
    vehicleDeposit: number; // Caution de garantie du véhicule (séparée, sera remboursée)
    securityDeposit: number; // Alias pour vehicleDeposit (clarté)
    downPayment: number; // Acompte sur la location (30% du total)
    remainingAmount: number; // Solde à payer à la remise
    numberOfDays: number;
    breakdown: {
      vehicle: {
        pricePerDay: number;
        days: number;
        total: number;
      };
      services: Array<{
        id: string;
        name: string;
        price: number;
        pricingType: "PER_DAY" | "FIXED" | "PERCENTAGE";
        total: number;
      }>;
    };
  };
  error?: string;
}

/**
 * Calcule le prix total d'une réservation (véhicule + services)
 */
export async function calculateBookingPriceAction(
  input: CalculatePriceInput
): Promise<CalculatePriceResult> {
  try {
    // Récupérer le véhicule
    const vehicleResult = await getPublicVehicleByIdAction(input.vehicleId);

    if (!vehicleResult.success || !vehicleResult.data) {
      return {
        success: false,
        error: "Véhicule introuvable",
      };
    }

    const vehicle = vehicleResult.data;

    // Calculer le nombre de jours (facturation prorata)
    const [startHours, startMinutes] = input.startTime.split(":").map(Number);
    const [endHours, endMinutes] = input.endTime.split(":").map(Number);

    const start = new Date(input.startDate);
    start.setHours(
      !isNaN(startHours) ? startHours : 0,
      !isNaN(startMinutes) ? startMinutes : 0,
      0,
      0
    );

    const end = new Date(input.endDate);
    end.setHours(
      !isNaN(endHours) ? endHours : 0,
      !isNaN(endMinutes) ? endMinutes : 0,
      0,
      0
    );

    const diffMs = end.getTime() - start.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;
    const numberOfDays = Math.max(diffMs / msPerDay, 1); // Minimum 1 jour

    // Calculer le prix du véhicule
    const vehiclePrice = vehicle.pricePerDay * numberOfDays;

    // Récupérer les services sélectionnés
    const serviceIds = input.serviceIds || [];
    let servicesPrice = 0;
    const servicesBreakdown: Array<{
      id: string;
      name: string;
      price: number;
      pricingType: "PER_DAY" | "FIXED" | "PERCENTAGE";
      total: number;
    }> = [];

    if (serviceIds.length > 0) {
      const servicesResult = await getPublicServicesAction(input.vehicleId);

      if (!servicesResult.success || !servicesResult.data) {
        return {
          success: false,
          error: "Impossible de récupérer les services",
        };
      }

      const selectedServices = servicesResult.data.filter((service) =>
        serviceIds.includes(service.id)
      );

      for (const service of selectedServices) {
        let serviceTotal = 0;

        switch (service.pricingType) {
          case "PER_DAY":
            serviceTotal = service.price * numberOfDays;
            break;
          case "FIXED":
            serviceTotal = service.price;
            break;
          case "PERCENTAGE":
            serviceTotal = (vehiclePrice * service.price) / 100;
            break;
        }

        servicesPrice += serviceTotal;
        servicesBreakdown.push({
          id: service.id,
          name: service.name,
          price: service.price,
          pricingType: service.pricingType,
          total: serviceTotal,
        });
      }
    }

    // Calculer le total de la location (véhicule + services)
    const totalPrice = vehiclePrice + servicesPrice;

    // La caution du véhicule est une garantie SÉPARÉE, pas un acompte
    // Elle sera bloquée puis remboursée après restitution
    const securityDeposit = vehicle.deposit || 0;

    // Calculer l'acompte sur la location (30% du total de la location)
    const downPayment = totalPrice * 0.3;

    // Calculer le solde à payer à la remise
    const remainingAmount = totalPrice - downPayment;

    return {
      success: true,
      data: {
        vehiclePrice,
        servicesPrice,
        totalPrice,
        deposit: downPayment, // Acompte sur la location (pour compatibilité avec le code existant)
        vehicleDeposit: securityDeposit, // Caution de garantie (séparée)
        securityDeposit: securityDeposit, // Alias pour clarté
        downPayment: downPayment, // Acompte sur la location
        remainingAmount,
        numberOfDays,
        breakdown: {
          vehicle: {
            pricePerDay: vehicle.pricePerDay,
            days: numberOfDays,
            total: vehiclePrice,
          },
          services: servicesBreakdown,
        },
      },
    };
  } catch (error) {
    console.error("[Public Booking] Erreur lors du calcul du prix", error);
    return {
      success: false,
      error: "Impossible de calculer le prix de la réservation",
    };
  }
}

