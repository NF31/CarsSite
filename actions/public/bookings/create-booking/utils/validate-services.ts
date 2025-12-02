import { prisma } from "@/lib/prisma";

export async function validateServices(serviceIds: string[]): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (serviceIds.length === 0) {
    return { valid: true };
  }

  const uniqueServiceIds = Array.from(new Set(serviceIds));
  const services = await prisma.service.findMany({
    where: {
      id: { in: uniqueServiceIds },
    },
    select: { id: true, active: true },
  });

  if (services.length !== uniqueServiceIds.length) {
    return {
      valid: false,
      error: "Certains services choisis n'existent pas ou ne sont plus disponibles",
    };
  }

  const inactive = services.find((service) => !service.active);
  if (inactive) {
    return {
      valid: false,
      error: "Un service sélectionné est inactif",
    };
  }

  return { valid: true };
}

