"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Camera, AlertCircle, CheckCircle2 } from "lucide-react";
import type { UserProfile } from "../types";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { updateProfileSchema } from "@/lib/validations/profile";

type PersonalInfoCardProps = {
  user: UserProfile;
  form: UseFormReturn<z.infer<typeof updateProfileSchema>>;
  onSubmit: (data: z.infer<typeof updateProfileSchema>) => Promise<void>;
  isSaving: boolean;
  showPhoneValid: boolean;
  setShowPhoneValid: (show: boolean) => void;
  driverLicenseSection: React.ReactNode;
};

export function PersonalInfoCard({
  user,
  form,
  onSubmit,
  isSaving,
  showPhoneValid,
  setShowPhoneValid,
  driverLicenseSection,
}: PersonalInfoCardProps) {
  // Gérer l'affichage temporaire du message "Format valide" pour le téléphone
  const phoneValue = form.watch("phone");
  const phoneError = form.formState.errors.phone;
  const phoneTouched = form.formState.touchedFields.phone;

  useEffect(() => {
    if (phoneValue && !phoneError && phoneTouched) {
      setShowPhoneValid(true);
      const timer = setTimeout(() => {
        setShowPhoneValid(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowPhoneValid(false);
    }
  }, [phoneValue, phoneError, phoneTouched, setShowPhoneValid]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations personnelles
        </CardTitle>
        <CardDescription>Modifiez vos informations de contact</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="pl-9 bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">L&apos;email ne peut pas être modifié</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                {...form.register("name")}
                className="pl-9"
                placeholder="Votre nom complet"
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                {...form.register("phone")}
                className={`pl-9 ${
                  form.formState.errors.phone
                    ? "border-red-500"
                    : form.watch("phone") &&
                      !form.formState.errors.phone &&
                      form.formState.touchedFields.phone
                    ? "border-green-500"
                    : ""
                }`}
                placeholder="+33 6 12 34 56 78"
                onBlur={() => form.trigger("phone")}
              />
            </div>
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {form.formState.errors.phone.message}
              </p>
            )}
            {showPhoneValid && (
              <p className="text-sm text-green-600 flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4" />
                Format valide
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Photo de profil (URL)</Label>
            <div className="relative">
              <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="image"
                {...form.register("image")}
                className="pl-9"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {form.formState.errors.image && (
              <p className="text-sm text-red-600">{form.formState.errors.image.message}</p>
            )}
          </div>

          {driverLicenseSection}

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

