import { prisma } from "@/lib/prisma";

export interface ValidationError {
  success: false;
  error: string;
}

export type ValidationResult =
  | { success: true; serviceIds: string[] }
  | ValidationError;

/**
 * Valide les services sélectionnés pour la réservation
 */
export async function validateServices(
  serviceIds: string[],
  existingServiceIds: string[]
): Promise<ValidationResult> {
  const uniqueServiceIds = Array.from(new Set(serviceIds));

  if (uniqueServiceIds.length === 0) {
    return { success: true, serviceIds: [] };
  }

  const services = await prisma.service.findMany({
    where: {
      id: { in: uniqueServiceIds },
    },
    select: { id: true, active: true },
  });

  if (services.length !== uniqueServiceIds.length) {
    return {
      success: false,
      error: "Certains services choisis n'existent pas ou ne sont plus disponibles.",
    };
  }

  const newlySelectedInactive = services.find(
    (service) => !service.active && !existingServiceIds.includes(service.id)
  );

  if (newlySelectedInactive) {
    return {
      success: false,
      error: "Un service sélectionné est inactif.",
    };
  }

  return { success: true, serviceIds: uniqueServiceIds };
}

