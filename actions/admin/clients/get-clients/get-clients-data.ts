import prisma, { type Prisma } from '@/lib/prisma'
interface GetClientsDataParams {
  where: Prisma.UserWhereInput;
  orderBy: Prisma.UserOrderByWithRelationInput;
  skip: number;
  limit: number;
}

export async function getClientsData(params: GetClientsDataParams) {
  const { where, orderBy, skip, limit } = params;

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        deletedAt: true,
        lockedUntil: true,
        driverLicense: true,
        bookings: {
          orderBy: {
            startDate: "desc",
          },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            vehicle: {
              select: {
                id: true,
                brand: true,
                model: true,
                licensePlate: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    clients,
    total,
  };
}

