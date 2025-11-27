"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface BookingEditErrorProps {
  message: string;
}

export const BookingEditError = memo(function BookingEditError({
  message,
}: BookingEditErrorProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
});

