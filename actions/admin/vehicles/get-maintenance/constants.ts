export const DEFAULT_FILTERS = {
  status: "ACTIVE" as const,
  type: "ALL" as const,
  includeBlocked: false,
  page: 1,
  limit: 10,
  sortBy: "startDate" as const,
} as const;

export const PAGINATION_LIMITS = {
  MIN: 1,
  MAX: 50,
} as const;

export const VEHICLE_SELECT_FIELDS = {
  id: true,
  brand: true,
  model: true,
  licensePlate: true,
  year: true,
  status: true,
  images: true,
  location: {
    select: {
      id: true,
      name: true,
      city: true,
    },
  },
} as const;

export const NEXT_MAINTENANCE_SELECT_FIELDS = {
  id: true,
  brand: true,
  model: true,
  licensePlate: true,
} as const;

