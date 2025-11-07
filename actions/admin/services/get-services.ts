"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { ServicePricingType, VehicleCategory } from "@prisma/client";

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "ECONOMY",
  "COMPACT",
  "MID_SIZE",
  "FULL_SIZE",
  "SUV",
  "LUXURY",
  "VAN",
];

const PRICING_TYPES: ServicePricingType[] = ["PER_DAY", "FIXED", "PERCENTAGE"];

export interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  price: number;
  pricingType: ServicePricingType;
  availableForCategories: VehicleCategory[];
  icon: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicesSummary {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number | null;
  pricingTypes: Record<ServicePricingType, number>;
  categories: Record<VehicleCategory, number>;
}

export interface GetServicesResult {
  success: boolean;
  data?: {
    services: ServiceRecord[];
    summary: ServicesSummary;
  };
  error?: string;
}

export async function getServicesAction(): Promise<GetServicesResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Vous n'avez pas les permissions nécessaires pour consulter les services.",
      };
    }

    const services = await prisma.service.findMany({
      orderBy: [
        { active: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        pricingType: true,
        availableForCategories: true,
        icon: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = services.length;
    const activeCount = services.filter((service) => service.active).length;
    const inactiveCount = total - activeCount;
    const averagePrice =
      total > 0 ? services.reduce((acc, service) => acc + service.price, 0) / total : null;

    const pricingTypeBreakdown = PRICING_TYPES.reduce<Record<ServicePricingType, number>>(
      (acc, pricingType) => {
        acc[pricingType] = services.filter(
          (service) => service.pricingType === pricingType
        ).length;
        return acc;
      },
      {
        PER_DAY: 0,
        FIXED: 0,
        PERCENTAGE: 0,
      }
    );

    const categoryCoverage = VEHICLE_CATEGORIES.reduce<Record<VehicleCategory, number>>(
      (acc, category) => {
        acc[category] = services.filter((service) =>
          (service.availableForCategories ?? []).includes(category)
        ).length;
        return acc;
      },
      {
        ECONOMY: 0,
        COMPACT: 0,
        MID_SIZE: 0,
        FULL_SIZE: 0,
        SUV: 0,
        LUXURY: 0,
        VAN: 0,
      }
    );

    const serializedServices: ServiceRecord[] = services.map((service) => ({
      ...service,
      description: service.description ?? null,
      icon: service.icon ?? null,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        services: serializedServices,
        summary: {
          total,
          active: activeCount,
          inactive: inactiveCount,
          averagePrice,
          pricingTypes: pricingTypeBreakdown,
          categories: categoryCoverage,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching services:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la récupération des services.",
    };
  }
}

