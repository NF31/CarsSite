import type { AdminAgencySettings } from "@/types/admin-settings";

/**
 * Normalise les données de l'agence en remplaçant les valeurs null/undefined par des chaînes vides
 */
export function normalizeAgencyData(agency: AdminAgencySettings) {
  return {
    name: agency.name ?? "",
    logoUrl: agency.logoUrl ?? "",
    address: agency.address ?? "",
    phone: agency.phone ?? "",
    email: agency.email ?? "",
    openingHours: agency.openingHours ?? "",
  };
}

