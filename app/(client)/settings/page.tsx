"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Globe, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Préférences de notification
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des paramètres");
      }
      const data = await response.json();
      
      if (data.preferences) {
        setEmailNotifications(data.preferences.emailNotifications ?? true);
        setBookingReminders(data.preferences.bookingReminders ?? true);
        setPromotionalEmails(data.preferences.promotionalEmails ?? false);
        setMarketingEmails(data.preferences.marketingEmails ?? false);
      }
    } catch (err) {
      setError("Erreur lors du chargement des paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          bookingReminders,
          promotionalEmails,
          marketingEmails,
          language: "fr",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'enregistrement");
      }

      setSuccess(result.message || "Paramètres enregistrés avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 sm:px-6 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos préférences et paramètres de compte</p>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez vos préférences de notification par email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base">
                  Notifications par email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications importantes par email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="booking-reminders" className="text-base">
                  Rappels de réservation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des rappels avant vos réservations
                </p>
              </div>
              <Switch
                id="booking-reminders"
                checked={bookingReminders}
                onCheckedChange={setBookingReminders}
                disabled={!emailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="promotional-emails" className="text-base">
                  Emails promotionnels
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des offres spéciales et promotions
                </p>
              </div>
              <Switch
                id="promotional-emails"
                checked={promotionalEmails}
                onCheckedChange={setPromotionalEmails}
                disabled={!emailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails" className="text-base">
                  Emails marketing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des newsletters et actualités
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={marketingEmails}
                onCheckedChange={setMarketingEmails}
                disabled={!emailNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confidentialité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Confidentialité
            </CardTitle>
            <CardDescription>
              Gérez vos paramètres de confidentialité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Visibilité du profil</Label>
                <p className="text-sm text-muted-foreground">
                  Contrôlez qui peut voir vos informations
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Privé
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Vos informations sont privées par défaut
            </p>
          </CardContent>
        </Card>

        {/* Langue et région */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Langue et région
            </CardTitle>
            <CardDescription>
              Préférences linguistiques et régionales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Langue</Label>
                <p className="text-sm text-muted-foreground">
                  Langue de l'interface
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Français
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La langue est définie automatiquement selon votre navigateur
            </p>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}

