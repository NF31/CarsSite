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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { deleteAccountSchema } from "@/lib/validations/profile";

type DeleteAccountCardProps = {
  form: UseFormReturn<z.infer<typeof deleteAccountSchema>>;
  onSubmit: (data: z.infer<typeof deleteAccountSchema>) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
  success: string | null;
  showDeletePassword: boolean;
  setShowDeletePassword: (show: boolean) => void;
};

export function DeleteAccountCard({
  form,
  onSubmit,
  isDeleting,
  error,
  success,
  showDeletePassword,
  setShowDeletePassword,
}: DeleteAccountCardProps) {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Zone de danger
        </CardTitle>
        <CardDescription>Supprimer définitivement votre compte</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Supprimer mon compte</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes vos données seront supprimées définitivement,
                y compris vos réservations, avis et factures.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deletePassword"
                    type={showDeletePassword ? "text" : "password"}
                    {...form.register("password")}
                    className="pl-9 pr-14"
                    placeholder="Entrez votre mot de passe"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 p-2"
                    aria-label={showDeletePassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showDeletePassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmText">
                  Tapez <strong>SUPPRIMER</strong> pour confirmer
                </Label>
                <Input
                  id="confirmText"
                  {...form.register("confirmText")}
                  placeholder="SUPPRIMER"
                />
                {form.formState.errors.confirmText && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmText.message}
                  </p>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting || !form.formState.isValid}
                >
                  {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

