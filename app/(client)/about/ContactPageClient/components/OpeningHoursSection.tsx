import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactInfo } from "@/actions/public/contact/get-contact-info";

interface OpeningHoursSectionProps {
  openingHours: string;
  phone: ContactInfo["phone"];
}

export function OpeningHoursSection({ openingHours, phone }: OpeningHoursSectionProps) {
  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Horaires d&apos;ouverture</CardTitle>
            <CardDescription>Heures de disponibilité de notre service client</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-900">Horaires</span>
            <span className="text-muted-foreground">{openingHours}</span>
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="font-semibold text-gray-900">Assistance 24/7 :</strong> Pour les
              urgences liées à une réservation en cours, contactez-nous au{" "}
              <a
                href={`tel:${phone.number}`}
                className="font-semibold text-primary hover:underline"
              >
                {phone.display}
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

