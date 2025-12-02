import { prisma } from "@/lib/prisma";

export async function updateUserTermsAcceptance(userId: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { termsAcceptedAt: true },
  });

  // Enregistrer la date d'acceptation seulement si pas déjà accepté
  if (!existingUser?.termsAcceptedAt) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        termsAcceptedAt: new Date(),
      },
    });
  }
}

