import type { SearchFormData } from "../types";

export function buildSearchParams(data: SearchFormData): URLSearchParams {
  const params = new URLSearchParams();

  if (data.category) {
    params.set("category", data.category);
  }
  if (data.pickupValue) {
    params.set("pickup", data.pickupValue);
  }
  if (data.pickupPlaceId) {
    params.set("pickupPlaceId", data.pickupPlaceId);
  }
  if (data.showDifferentReturn && data.returnValue) {
    params.set("returnLocation", data.returnValue);
  } else if (data.pickupValue) {
    params.set("returnLocation", data.pickupValue);
  }
  if (data.showDifferentReturn && data.returnPlaceId) {
    params.set("returnPlaceId", data.returnPlaceId);
  } else if (data.pickupPlaceId) {
    params.set("returnPlaceId", data.pickupPlaceId);
  }
  if (data.startDate) {
    params.set("startDate", data.startDate);
  }
  if (data.endDate) {
    params.set("endDate", data.endDate);
  }
  if (data.startTime) {
    params.set("startTime", data.startTime);
  }
  if (data.endTime) {
    params.set("endTime", data.endTime);
  }

  return params;
}

