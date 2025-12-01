import type { VehicleDetailsInlineProps } from "../types";

export function buildBookingUrl(
  vehicleId: string,
  props: Pick<VehicleDetailsInlineProps, "startDate" | "endDate" | "startTime" | "endTime" | "pickup" | "returnLocation">
): string {
  const params = new URLSearchParams();
  params.set("vehicleId", vehicleId);

  if (props.startDate) {
    params.set("startDate", props.startDate);
  }
  if (props.endDate) {
    params.set("endDate", props.endDate);
  }
  if (props.startTime) {
    params.set("startTime", props.startTime);
  }
  if (props.endTime) {
    params.set("endTime", props.endTime);
  }
  if (props.pickup) {
    params.set("pickup", props.pickup);
  }
  if (props.returnLocation) {
    params.set("returnLocation", props.returnLocation);
  }

  return `/bookings/new?${params.toString()}`;
}

