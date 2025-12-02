import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ContactInfoItem } from "./ContactInfoItem";
import { OpeningHoursPreview } from "./OpeningHoursPreview";
import { getInitials, formatOpeningHours } from "../utils";
import { memo } from "react";

interface AgencyPreviewCardProps {
  form: {
    name: string;
    logoUrl: string;
    address: string;
    phone: string;
    email: string;
    openingHours: string;
  };
  copiedField: "address" | "phone" | "email" | null;
  onCopy: (value: string, field: "address" | "phone" | "email") => void;
}

export const AgencyPreviewCard = memo(function AgencyPreviewCard({
  form,
  copiedField,
  onCopy,
}: AgencyPreviewCardProps) {
  const initials = getInitials(form.name);
  const openingHoursPreview = formatOpeningHours(form.openingHours);

  return (
    <Card>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            {form.logoUrl ? (
              <AvatarImage src={form.logoUrl} alt={form.name || "Logo agence"} />
            ) : null}
            <AvatarFallback className="text-lg font-semibold text-primary bg-primary/5">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-xl">{form.name || "Nom de l'agence"}</CardTitle>
            <CardDescription>
              Ces informations apparaissent sur les factures, emails et pages publiques.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <ContactInfoItem
            field="address"
            value={form.address}
            copied={copiedField === "address"}
            onCopy={() => onCopy(form.address, "address")}
          />
          <ContactInfoItem
            field="phone"
            value={form.phone}
            copied={copiedField === "phone"}
            onCopy={() => onCopy(form.phone, "phone")}
          />
          <ContactInfoItem
            field="email"
            value={form.email}
            copied={copiedField === "email"}
            onCopy={() => onCopy(form.email, "email")}
          />
        </div>

        <Separator />

        <OpeningHoursPreview hours={openingHoursPreview} />
      </CardContent>
    </Card>
  );
});

