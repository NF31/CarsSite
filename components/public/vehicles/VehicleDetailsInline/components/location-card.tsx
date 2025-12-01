"use client";

import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { Vehicle } from "../types";

type LocationCardProps = {
  vehicle: Vehicle;
};

export function LocationCard({ vehicle }: LocationCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">{vehicle.location.name}</p>
              <p className="text-sm text-muted-foreground">
                {vehicle.location.city}
                {vehicle.location.address && ` • ${vehicle.location.address}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}

