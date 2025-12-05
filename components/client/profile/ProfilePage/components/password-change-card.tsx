"use client";

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
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { changePasswordSchema } from "@/lib/validations/profile";

type PasswordChangeCardProps = {
  form: UseFormReturn<z.infer<typeof changePasswordSchema>>;
  onSubmit: (data: z.infer<typeof changePasswordSchema>) => Promise<void>;
  isChangingPassword: boolean;
  error: string | null;
  success: string | null;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
};

export function PasswordChangeCard({
  form,
  onSubmit,
  isChangingPassword,
  error,
  success,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: PasswordChangeCardProps) {
  const newPassword = form.watch("newPassword");
  const confirmPassword = form.watch("confirmPassword");
  const passwordErrors = form.formState.errors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Changer le mot de passe
        </CardTitle>
        <CardDescription>Mettez à jour votre mot de passe pour sécuriser votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                {...form.register("currentPassword")}
                className="pl-9 pr-14"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 p-2"
                aria-label={showCurrentPassword ? "Masquer le mot de passe actuel" : "Afficher le mot de passe actuel"}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {form.formState.errors.currentPassword && (
              <p className="text-sm text-red-600">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                {...form.register("newPassword")}
                className={`pl-9 pr-14 ${
                  newPassword && passwordErrors.newPassword
                    ? "border-red-500"
                    : newPassword && !passwordErrors.newPassword
                    ? "border-green-500"
                    : ""
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 p-2"
                aria-label={showNewPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {newPassword && (
              <div className="space-y-1 text-xs">
                <div
                  className={`flex items-center gap-2 ${
                    newPassword.length >= 8 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {newPassword.length >= 8 ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Au moins 8 caractères
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    /[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {/[A-Z]/.test(newPassword) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Une majuscule
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    /[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {/[a-z]/.test(newPassword) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Une minuscule
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    /[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {/[0-9]/.test(newPassword) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Un chiffre
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    /[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {/[^A-Za-z0-9]/.test(newPassword) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Un caractère spécial
                </div>
              </div>
            )}
            {form.formState.errors.newPassword && (
              <p className="text-sm text-red-600">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...form.register("confirmPassword")}
                className={`pl-9 pr-14 ${
                  confirmPassword && passwordErrors.confirmPassword
                    ? "border-red-500"
                    : confirmPassword && newPassword === confirmPassword
                    ? "border-green-500"
                    : ""
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 p-2"
                aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Les mots de passe correspondent
              </p>
            )}
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-red-600">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isChangingPassword || !form.formState.isValid}>
            {isChangingPassword ? "Modification..." : "Changer le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

