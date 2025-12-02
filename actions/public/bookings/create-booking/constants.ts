export const REFERENCE_GENERATION_ATTEMPTS = 5;

export const VEHICLE_SELECT_FIELDS = {
  id: true,
  brand: true,
  model: true,
  licensePlate: true,
  locationId: true,
  location: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const LOCATION_SELECT_FIELDS = {
  id: true,
  name: true,
} as const;

export const BOOKING_CREATE_SELECT_FIELDS = {
  id: true,
  reference: true,
} as const;

