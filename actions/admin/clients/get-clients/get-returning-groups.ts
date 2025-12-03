import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

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

