"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "../types";
import type { VehicleDetailsInlineProps } from "../types";

type BookButtonProps = {
  vehicle: Vehicle;
  props: Pick<
    VehicleDetailsInlineProps,
    "startDate" | "endDate" | "startTime" | "endTime" | "pickup" | "returnLocation"
  >;
};

export function BookButton({ vehicle, props }: BookButtonProps) {
  const bookingUrl = `/bookings/new?vehicleId=${vehicle.id}${
    props.startDate ? `&startDate=${props.startDate}` : ""
  }${props.endDate ? `&endDate=${props.endDate}` : ""}${
    props.startTime ? `&startTime=${props.startTime}` : ""
  }${props.endTime ? `&endTime=${props.endTime}` : ""}${
    props.pickup ? `&pickup=${encodeURIComponent(props.pickup)}` : ""
  }${
    props.returnLocation
      ? `&returnLocation=${encodeURIComponent(props.returnLocation)}`
      : ""
  }`;

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button size="lg" className="w-full" asChild>
        <Link href={bookingUrl}>Réserver maintenant</Link>
      </Button>
    </m.div>
  );
}

