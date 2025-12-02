import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageBanner } from "./MessageBanner";
import type { AdminAgencySettings } from "@/types/admin-settings";
import { memo } from "react";

interface AgencyFormProps {
  form: {
    name: string;
    logoUrl: string;
    address: string;
    phone: string;
    email: string;
    openingHours: string;
  };
  message: { type: "success" | "error"; text: string } | null;
  onMessageClose: () => void;
  getError: (field: keyof AdminAgencySettings) => string | undefined;
  updateField: (field: keyof AdminAgencySettings, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const AgencyForm = memo(function AgencyForm({
  form,
  message,
  onMessageClose,
  getError,
  updateField,
  onSubmit,
}: AgencyFormProps) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Modifier les informations</CardTitle>
        <CardDescription>
          Mettez à jour les informations visibles par vos clients et partenaires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="agency-settings-form" className="space-y-6" onSubmit={onSubmit}>
          {message && <MessageBanner message={message} onClose={onMessageClose} />}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Nom de l&apos;agence</Label>
              <Input
                id="agency-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="CarRental Paris"
              />
              {getError("name") && <p className="text-sm text-red-600">{getError("name")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency-logo">Logo (URL)</Label>
              <Input
                id="agency-logo"
                value={form.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
              />
              {getError("logoUrl") ? (
                <p className="text-sm text-red-600">{getError("logoUrl")}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Utilisez une image carrée au format PNG ou SVG hébergée sur Cloudinary.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-address">Adresse complète</Label>
            <Textarea
              id="agency-address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              rows={3}
              placeholder="123 Avenue de la Liberté, 75000 Paris"
            />
            {getError("address") && (
              <p className="text-sm text-red-600">{getError("address")}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agency-phone">Téléphone</Label>
              <Input
                id="agency-phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
              {getError("phone") && <p className="text-sm text-red-600">{getError("phone")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency-email">Email</Label>
              <Input
                id="agency-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="contact@carrental.fr"
              />
              {getError("email") && <p className="text-sm text-red-600">{getError("email")}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-hours">Horaires d&apos;ouverture</Label>
            <Textarea
              id="agency-hours"
              value={form.openingHours}
              onChange={(e) => updateField("openingHours", e.target.value)}
              rows={4}
              placeholder={"Lundi - Vendredi : 08h30 - 19h00\nSamedi : 09h00 - 18h00\nDimanche : Fermé"}
            />
            {getError("openingHours") ? (
              <p className="text-sm text-red-600">{getError("openingHours")}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Chaque ligne correspond à une journée. Exemple : &quot;Lundi : 08h30 - 19h00&quot;.
              </p>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Bonnes pratiques</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Indiquez un numéro joignable pendant les horaires d&apos;ouverture.</li>
              <li>Précisez si des permanences téléphoniques existent en dehors des heures classiques.</li>
              <li>
                Pour plusieurs agences, créez des fiches dédiées dans la section &quot;Paramètres &gt; Agences&quot;.
              </li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

