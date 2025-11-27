"use client";

import { memo } from "react";
import { User, Mail, Phone, IdCard, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { BookingDetail } from "@/actions/admin/bookings";

interface BookingClientCardProps {
  booking: BookingDetail;
  lastLicenseUploadLabel: string | null;
  isLicensePending: boolean;
  licenseError: string | null;
  onViewLicense: () => void;
}

export const BookingClientCard = memo(function BookingClientCard({
  booking,
  lastLicenseUploadLabel,
  isLicensePending,
  licenseError,
  onViewLicense,
}: BookingClientCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-muted-foreground" />
          Client & documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900 break-words">{booking.user.name}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {booking.user.email && (
                <span className="inline-flex items-center gap-1 break-words">
                  <Mail className="h-4 w-4" />
                  {booking.user.email}
                </span>
              )}
              {booking.user.phone && (
                <span className="inline-flex items-center gap-1 break-words">
                  <Phone className="h-4 w-4" />
                  {booking.user.phone}
                </span>
              )}
            </div>
          </div>
          <Badge variant="outline" className="uppercase text-[11px]">
            {booking.user.role}
          </Badge>
        </div>

        <Separator />

        <div className="space-y-3 rounded-md border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Permis de conduire</p>
              <p
                className={cn(
                  "text-sm font-medium inline-flex items-center gap-2",
                  booking.user.hasDriverLicense ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {booking.user.hasDriverLicense ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Permis enregistré
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Permis manquant
                  </>
                )}
              </p>
              {lastLicenseUploadLabel && (
                <p className="text-xs text-muted-foreground">Dernière mise à jour le {lastLicenseUploadLabel}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Remplacements utilisés : {booking.user.driverLicenseUploadCount ?? 0}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full lg:w-auto lg:shrink-0"
              onClick={onViewLicense}
              disabled={!booking.user.hasDriverLicense || isLicensePending}
            >
              {isLicensePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ouverture...
                </>
              ) : (
                <>
                  <IdCard className="mr-2 h-4 w-4" />
                  Voir le permis
                </>
              )}
            </Button>
          </div>
          {licenseError && <p className="text-xs text-red-600">{licenseError}</p>}
        </div>
      </CardContent>
    </Card>
  );
});

