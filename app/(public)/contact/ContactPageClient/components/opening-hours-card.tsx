import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { OpeningHours } from "../types";

interface OpeningHoursCardProps {
  hours: OpeningHours[];
  emergencyPhone: string;
}

export function OpeningHoursCard({ hours, emergencyPhone }: OpeningHoursCardProps) {
  return (
    <Card className="border-2 shadow-lg w-full">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="rounded-xl bg-primary/20 p-2 sm:p-3 flex-shrink-0">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl mb-1 break-words">Horaires d&apos;ouverture</CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">Heures de disponibilité</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {hours.map((schedule, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b last:border-0 gap-1 sm:gap-0"
            >
              <span className="text-xs sm:text-sm font-semibold text-foreground break-words">{schedule.day}</span>
              <span className="text-xs sm:text-sm text-muted-foreground break-words">{schedule.hours}</span>
            </div>
          ))}
          <div className="mt-3 sm:mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 sm:p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="font-semibold text-foreground block mb-1">Assistance 24/7 :</strong>
              Pour les urgences, contactez-nous au{" "}
              <a href={`tel:${emergencyPhone}`} className="font-semibold text-primary hover:underline break-all">
                {emergencyPhone}
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

