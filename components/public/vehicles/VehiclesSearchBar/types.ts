export interface VehiclesSearchBarProps {
  initialPickup?: string;
  initialPickupPlaceId?: string;
  initialReturnLocation?: string;
  initialReturnPlaceId?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialCategory?: string;
}

export interface SearchFormData {
  pickupValue: string;
  pickupPlaceId: string;
  returnValue: string;
  returnPlaceId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  category: string;
  showDifferentReturn: boolean;
}

