"use client";

import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Vehicle } from "../types";

type FeaturesCardProps = {
  vehicle: Vehicle;
};

export function FeaturesCard({ vehicle }: FeaturesCardProps) {
  if (!vehicle.features || vehicle.features.length === 0) {
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">Équipements</h3>
          <div className="flex flex-wrap gap-2">
            {vehicle.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}

