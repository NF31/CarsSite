declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: typeof google.maps.places.Autocomplete;
        };
        event?: {
          clearInstanceListeners: (instance: unknown) => void;
        };
      };
    };
  }
}

export interface SearchFormData {
  pickupValue: string;
  pickupPlaceId: string;
  returnValue: string;
  returnPlaceId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  showDifferentReturn: boolean;
}

export interface SearchFormErrors {
  message: string | null;
}

