"use server";

import { prisma } from "@/lib/prisma";
import { createDefaultAdminSettings } from "@/actions/admin/settings/shared";
import {
  getOrSetCache,
  CACHE_PREFIXES,
  CACHE_TTL,
} from "@/lib/cache";

export interface ContactInfo {
  phone: {
    number: string;
    display: string;
    hours: string;
  };
  email: {
    address: string;
    responseTime: string;
  };
  address: {
    street: string;
    city: string;
    full: string;
  };
  openingHours: string;
}

export interface GetContactInfoResult {
  success: boolean;
  data?: ContactInfo;
  error?: string;
}

export async function getContactInfoAction(): Promise<GetContactInfoResult> {
  try {
    // Utiliser le cache Redis pour les informations de contact
    const data = await getOrSetCache(
      "contact-info",
      async () => {
        const settings = await prisma.setting.findMany({
          where: {
            key: {
              in: [
                "agency.phone",
                "agency.email",
                "agency.address",
                "agency.openingHours",
              ],
            },
          },
        });

        const defaultSettings = createDefaultAdminSettings();
        const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

        const phone = typeof settingsMap.get("agency.phone") === "string"
          ? (settingsMap.get("agency.phone") as string)
          : defaultSettings.agency.phone;

        const email = typeof settingsMap.get("agency.email") === "string"
          ? (settingsMap.get("agency.email") as string)
          : defaultSettings.agency.email;

        const address = typeof settingsMap.get("agency.address") === "string"
          ? (settingsMap.get("agency.address") as string)
          : defaultSettings.agency.address;

        const openingHours = typeof settingsMap.get("agency.openingHours") === "string"
          ? (settingsMap.get("agency.openingHours") as string)
          : defaultSettings.agency.openingHours;

        // Parser l'adresse (format: "123 Avenue de la République, 75011 Paris, France")
        const addressParts = address.split(",").map((part) => part.trim());
        const street = addressParts[0] || "";
        const city = addressParts.slice(1).join(", ") || "";

        // Formater le téléphone pour l'affichage
        const phoneNumber = phone.replace(/\s/g, "");
        const phoneDisplay = phone;

        // Extraire les heures depuis openingHours (format: "Lun - Ven : 9h - 18h")
        const hoursMatch = openingHours.match(/(\d+h)\s*-\s*(\d+h)/);
        const hours = hoursMatch ? `${hoursMatch[1]} - ${hoursMatch[2]}` : "9h - 18h";

        return {
          phone: {
            number: phoneNumber,
            display: phoneDisplay,
            hours: hours,
          },
          email: {
            address: email,
            responseTime: "Réponse sous 24h",
          },
          address: {
            street,
            city,
            full: address,
          },
          openingHours,
        };
      },
      {
        prefix: CACHE_PREFIXES.SETTINGS,
        ttl: CACHE_TTL.SETTINGS,
      }
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Contact info - get error:", error);

    return {
      success: false,
      error: "Une erreur est survenue lors du chargement des informations de contact.",
    };
  }
}

