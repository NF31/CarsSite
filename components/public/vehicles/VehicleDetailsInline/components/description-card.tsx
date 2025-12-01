"use client";

import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { Vehicle } from "../types";

type DescriptionCardProps = {
  vehicle: Vehicle;
};

export function DescriptionCard({ vehicle }: DescriptionCardProps) {
  if (!vehicle.description) {
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">Description</h3>
          <p className="text-muted-foreground whitespace-pre-line">{vehicle.description}</p>
        </CardContent>
      </Card>
    </m.div>
  );
}

