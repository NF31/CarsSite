import prisma from '@/lib/prisma'
import { UserRole } from "@/lib/types/user-role";

export async function getReturningGroups() {
  const result = await prisma.booking.groupBy({
    by: ["userId"],
    _count: {
      _all: true,
    },
    where: {
      user: {
        role: UserRole.CLIENT,
      },
    },
  });

  return result;
}

