"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { AdminAgencySettings } from "@/types/admin-settings";
import { updateAgencySettingsAction } from "@/actions/admin/settings";
import {
  Building2,
  Check,
  Clock,
  Copy,
  MapPin,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type FieldErrors = Record<string, string[]>;
type CopyField = "address" | "phone" | "email" | null;

interface AgencySettingsPageClientProps {
  initialAgency: AdminAgencySettings;
}

export default function AgencySettingsPageClient({ initialAgency }: AgencySettingsPageClientProps) {
  const normalizedInitial = useMemo(
    () => ({
      name: initialAgency.name ?? "",
      logoUrl: initialAgency.logoUrl ?? "",
      address: initialAgency.address ?? "",
      phone: initialAgency.phone ?? "",
      email: initialAgency.email ?? "",
      openingHours: initialAgency.openingHours ?? "",
    }),
    [initialAgency],
  );

  const [form, setForm] = useState(normalizedInitial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<CopyField>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(normalizedInitial);
    setErrors({});
    setMessage(null);
  }, [normalizedInitial]);

  const resetForm = useCallback(() => {
    setForm(normalizedInitial);
    setErrors({});
    setMessage(null);
  }, [normalizedInitial]);

  const handleCopy = useCallback((value: string, field: Exclude<CopyField, null>) => {
    if (!value) {
      return;
    }
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => {
          setCopiedField((prev) => (prev === field ? null : prev));
        }, 2000);
      })
      .catch(() => {
        setMessage({
          type: "error",
          text: "Impossible de copier cette valeur.",
        });
      });
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      startTransition(async () => {
        setErrors({});
        setMessage(null);

        const payload = {
          name: form.name.trim(),
          logoUrl: form.logoUrl.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          openingHours: form.openingHours.trim(),
        };

        const result = await updateAgencySettingsAction(payload);

        if (!result.success) {
          setMessage({
            type: "error",
            text: result.error ?? "Impossible de mettre à jour les informations de l'agence.",
          });
          if (result.fieldErrors) {
            setErrors(result.fieldErrors);
          }
          return;
        }

        setMessage({
          type: "success",
          text: result.message ?? "Informations de l'agence mises à jour.",
        });
      });
    },
    [form, startTransition],
  );

  const getError = useCallback(
    (field: keyof AdminAgencySettings) => errors[field]?.[0],
    [errors],
  );

  const openingHoursPreview = useMemo(() => {
    const lines = form.openingHours
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return ["Horaires non renseignés"];
    }
    return lines;
  }, [form.openingHours]);

  const initials = useMemo(() => {
    const parts = form.name.trim().split(/\s+/);
    if (parts.length === 0) {
      return "AG";
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }, [form.name]);

  const renderMessage = useCallback(
    (onClose: () => void) => {
      if (!message) {
        return null;
      }
      const isSuccess = message.type === "success";
      return (
        <div
          className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {isSuccess ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium uppercase tracking-wide text-current transition-opacity hover:opacity-70"
          >
            Fermer
          </button>
        </div>
      );
    },
    [message],
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Informations de l&apos;agence</h1>
              <p className="text-sm text-muted-foreground">
                Gérez l&apos;identité et les coordonnées diffusées sur vos supports clients.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isPending}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            <Button type="submit" form="agency-settings-form" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
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
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Adresse</p>
                    <p>{form.address || "Adresse non renseignée"}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(form.address, "address")}
                    disabled={!form.address}
                    aria-label="Copier l'adresse"
                  >
                    {copiedField === "address" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <Phone className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Téléphone</p>
                    <p>{form.phone || "Numéro non renseigné"}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(form.phone, "phone")}
                    disabled={!form.phone}
                    aria-label="Copier le téléphone"
                  >
                    {copiedField === "phone" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <Mail className="mt-1 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Email</p>
                    <p>{form.email || "Email non renseigné"}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(form.email, "email")}
                    disabled={!form.email}
                    aria-label="Copier l'email"
                  >
                    {copiedField === "email" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  <Clock className="h-4 w-4" />
                  Horaires d&apos;ouverture
                </div>
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-3 text-sm">
                  <ul className="space-y-1">
                    {openingHoursPreview.map((line, index) => (
                      <li key={`${line}-${index}`} className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Modifier les informations</CardTitle>
            <CardDescription>
              Mettez à jour les informations visibles par vos clients et partenaires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="agency-settings-form" className="space-y-6" onSubmit={handleSubmit}>
              {renderMessage(() => setMessage(null))}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agency-name">Nom de l&apos;agence</Label>
                  <Input
                    id="agency-name"
                    value={form.name}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => ({ ...prev, name: value }));
                      if (errors.name) {
                        setErrors((prev) => {
                          const { name, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="CarRental Paris"
                  />
                  {getError("name") ? <p className="text-sm text-red-600">{getError("name")}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency-logo">Logo (URL)</Label>
                  <Input
                    id="agency-logo"
                    value={form.logoUrl}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => ({ ...prev, logoUrl: value }));
                      if (errors.logoUrl) {
                        setErrors((prev) => {
                          const { logoUrl, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
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
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => ({ ...prev, address: value }));
                    if (errors.address) {
                      setErrors((prev) => {
                        const { address, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  rows={3}
                  placeholder="123 Avenue de la Liberté, 75000 Paris"
                />
                {getError("address") ? <p className="text-sm text-red-600">{getError("address")}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agency-phone">Téléphone</Label>
                  <Input
                    id="agency-phone"
                    value={form.phone}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => ({ ...prev, phone: value }));
                      if (errors.phone) {
                        setErrors((prev) => {
                          const { phone, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="+33 1 23 45 67 89"
                  />
                  {getError("phone") ? <p className="text-sm text-red-600">{getError("phone")}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency-email">Email</Label>
                  <Input
                    id="agency-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => {
                      const value = event.target.value;
                      setForm((prev) => ({ ...prev, email: value }));
                      if (errors.email) {
                        setErrors((prev) => {
                          const { email, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    placeholder="contact@carrental.fr"
                  />
                  {getError("email") ? <p className="text-sm text-red-600">{getError("email")}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency-hours">Horaires d&apos;ouverture</Label>
                <Textarea
                  id="agency-hours"
                  value={form.openingHours}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((prev) => ({ ...prev, openingHours: value }));
                    if (errors.openingHours) {
                      setErrors((prev) => {
                        const { openingHours, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
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
      </div>
    </div>
  );
}


