/**
 * Constantes pour les requêtes de véhicules
 */
export const VEHICLE_SELECT_FIELDS = {
  location: {
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
    },
  },
  reviews: {
    select: {
      rating: true,
    },
  },
  _count: {
    select: {
      bookings: true,
      reviews: true,
    },
  },
} as const;

