import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/types/user-role";
import type { ClientStats } from "./types";
import { ONE_DAY_MS } from "./constants";

export async function getClientStats(now: Date): Promise<ClientStats> {
  const thirtyDaysAgo = new Date(now.getTime() - 30 * ONE_DAY_MS);

  const [
    totalClients,
    activeClients,
    inactiveClients,
    lockedClients,
    returningGroups,
    newClientsLast30Days,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: UserRole.CLIENT,
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.CLIENT,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.CLIENT,
        deletedAt: {
          not: null,
        },
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.CLIENT,
        deletedAt: null,
        lockedUntil: {
          gt: now,
        },
      },
    }),
    prisma.booking.groupBy({
      by: ["userId"],
      _count: {
        _all: true,
      },
      where: {
        user: {
          role: UserRole.CLIENT,
        },
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.CLIENT,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
  ]);

  return {
    totalClients,
    activeClients,
    inactiveClients,
    lockedClients,
    returningClients: returningGroups.length,
    newClientsLast30Days,
  };
}

