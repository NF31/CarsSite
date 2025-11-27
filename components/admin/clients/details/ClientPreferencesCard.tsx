"use client";

import { memo } from "react";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClientDetail } from "@/actions/admin/clients";

interface ClientPreferencesCardProps {
  preferences: ClientDetail["preferences"];
}

export const ClientPreferencesCard = memo(function ClientPreferencesCard({
  preferences,
}: ClientPreferencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Préférences de communication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {preferences ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Emails transactionnels</span>
              <Badge variant={preferences.emailNotifications ? "default" : "outline"}>
                {preferences.emailNotifications ? "Activés" : "Désactivés"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rappels de réservation</span>
              <Badge variant={preferences.bookingReminders ? "default" : "outline"}>
                {preferences.bookingReminders ? "Activés" : "Désactivés"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Promotions</span>
              <Badge variant={preferences.promotionalEmails ? "default" : "outline"}>
                {preferences.promotionalEmails ? "Activées" : "Désactivées"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Marketing</span>
              <Badge variant={preferences.marketingEmails ? "default" : "outline"}>
                {preferences.marketingEmails ? "Activés" : "Désactivés"}
              </Badge>
            </div>
            <Separator />
            <p className="text-muted-foreground">
              Langue préférée :{" "}
              <span className="font-medium text-gray-900 uppercase">
                {preferences.language}
              </span>
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            Préférences non configurées pour ce client.
          </p>
        )}
      </CardContent>
    </Card>
  );
});

