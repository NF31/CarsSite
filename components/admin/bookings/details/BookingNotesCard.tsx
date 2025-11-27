"use client";

import { memo } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingNotesCardProps {
  notes: string;
}

export const BookingNotesCard = memo(function BookingNotesCard({ notes }: BookingNotesCardProps) {
  if (!notes) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Notes internes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{notes}</p>
      </CardContent>
    </Card>
  );
});

