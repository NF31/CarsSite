"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useSession } from "next-auth/react";
import { getProfileAction, updateProfileAction, deleteAccountAction, getMyDriverLicenseUrlAction } from "@/actions/profile";
import { changePasswordAction } from "@/actions/profile/password";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Mail, Phone, Camera, Lock, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, Shield, Loader2, Upload } from "lucide-react";
import { ClientDriverLicenseUpload } from "@/components/client/ClientDriverLicenseUpload";
import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from "@/lib/validations/profile";
import type { z } from "zod";

type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  driverLicense: string | null;
  driverLicensePublicId: string | null;
  driverLicenseFileName: string | null;
  driverLicenseUploadCount: number | null;
  driverLicenseLastUploadedAt: Date | null;
  emailVerified: Date | null;
  role: string;
  createdAt: Date;
};

export default function ProfilePage() {
  const { update } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPhoneValid, setShowPhoneValid] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [isLicensePending, startLicenseTransition] = useTransition();
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);

  const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
  const DRIVER_LICENSE_COOLDOWN_DAYS = 21;

  // Calculer les informations de remplacement du permis
  const driverLicenseUploadInfo = useMemo(() => {
    if (!user?.driverLicense) {
      return {
        normalizedCount: 0,
        remaining: DRIVER_LICENSE_MAX_REPLACEMENTS,
        nextAllowedAt: null,
        lastWithinWindow: null,
      };
    }

    const rawCount = user.driverLicenseUploadCount ?? 0;
    const lastUploadedAt = user.driverLicenseLastUploadedAt;
    const now = new Date();
    const cooldownMs = DRIVER_LICENSE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

    let normalizedCount = rawCount;
    let lastWithinWindow = lastUploadedAt;

    if (lastUploadedAt && now.getTime() - lastUploadedAt.getTime() > cooldownMs) {
      normalizedCount = 0;
      lastWithinWindow = null;
    }

    const remaining = Math.max(DRIVER_LICENSE_MAX_REPLACEMENTS - normalizedCount, 0);
    const nextAllowedAt =
      remaining === 0 && lastWithinWindow
        ? new Date(lastWithinWindow.getTime() + cooldownMs)
        : null;

    return {
      normalizedCount,
      remaining,
      nextAllowedAt,
      lastWithinWindow,
    };
  }, [user?.driverLicense, user?.driverLicenseUploadCount, user?.driverLicenseLastUploadedAt]);

  const isDriverLicenseUploadBlocked = Boolean(
    driverLicenseUploadInfo.remaining === 0 && driverLicenseUploadInfo.nextAllowedAt
  );

  const profileForm = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onChange", // Validation en temps réel
  });

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const deleteForm = useForm<z.infer<typeof deleteAccountSchema>>({
    resolver: zodResolver(deleteAccountSchema),
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gérer l'affichage temporaire du message "Format valide" pour le téléphone
  const phoneValue = profileForm.watch("phone");
  const phoneError = profileForm.formState.errors.phone;
  const phoneTouched = profileForm.formState.touchedFields.phone;

  useEffect(() => {
    if (phoneValue && !phoneError && phoneTouched) {
      setShowPhoneValid(true);
      const timer = setTimeout(() => {
        setShowPhoneValid(false);
      }, 2000); // Disparaît après 2 secondes
      return () => clearTimeout(timer);
    } else {
      setShowPhoneValid(false);
    }
  }, [phoneValue, phoneError, phoneTouched]);

  const fetchProfile = async () => {
    try {
      const result = await getProfileAction();
      if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement du profil");
      }
      if (result.user) {
        setUser(result.user);
        profileForm.reset({
          name: result.user.name,
          phone: result.user.phone || "",
          image: result.user.image || "",
        });
      }
    } catch {
      setError("Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const onProfileSubmit = async (data: z.infer<typeof updateProfileSchema>) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfileAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }

      if (result.user) {
        setUser(result.user as UserProfile);
      }
      setSuccess(result.message || "Profil mis à jour avec succès");
      await update(); // Mettre à jour la session
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const result = await changePasswordAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du changement de mot de passe");
      }

      setPasswordSuccess(result.message || "Mot de passe modifié avec succès");
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onDeleteSubmit = async (data: z.infer<typeof deleteAccountSchema>) => {
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    try {
      const result = await deleteAccountAction(data);

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la demande de suppression");
      }

      // Afficher le message de succès
      setDeleteSuccess(result.message || "Un email de confirmation a été envoyé. Veuillez cliquer sur le lien dans l'email pour confirmer la suppression.");
      deleteForm.reset();
      
      // Masquer le message après 10 secondes
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 10000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erreur lors de la demande de suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDriverLicense = () => {
    if (!user?.driverLicense || isLicensePending) {
      return;
    }
    startLicenseTransition(async () => {
      setLicenseError(null);
      const result = await getMyDriverLicenseUrlAction();

      if (!result.success || !result.data) {
        setLicenseError(result.error ?? "Impossible de récupérer le permis.");
        return;
      }

      // Télécharger le PDF avec le nom du fichier original
      try {
        const response = await fetch(result.data.url);
        if (!response.ok) throw new Error("Erreur lors du téléchargement");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.fileName || "permis.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch {
        // Fallback : ouvrir dans un nouvel onglet
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      }
    });
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

  if (!user) {
    return (
      <div className="container py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-red-600">Erreur lors du chargement du profil</p>
        </div>
      </div>
    );
  }

  const newPassword = passwordForm.watch("newPassword");
  const confirmPassword = passwordForm.watch("confirmPassword");
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="container py-8 px-4 sm:px-6 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <ClientBreadcrumbs
          items={[
            { label: "Tableau de bord", href: "/dashboard" },
            { label: "Mon profil" },
          ]}
          className="mb-4"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600 mt-1">Gérez vos informations personnelles et votre compte</p>
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

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Modifiez vos informations de contact</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                <p className="text-xs text-muted-foreground">
                  L&apos;email ne peut pas être modifié
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    {...profileForm.register("name")}
                    className="pl-9"
                    placeholder="Votre nom complet"
                  />
                </div>
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-red-600">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...profileForm.register("phone")}
                    className={`pl-9 ${
                      profileForm.formState.errors.phone
                        ? "border-red-500"
                        : profileForm.watch("phone") && !profileForm.formState.errors.phone && profileForm.formState.touchedFields.phone
                        ? "border-green-500"
                        : ""
                    }`}
                    placeholder="+33 6 12 34 56 78"
                    onBlur={() => profileForm.trigger("phone")}
                  />
                </div>
                {profileForm.formState.errors.phone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {profileForm.formState.errors.phone.message}
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
                    {...profileForm.register("image")}
                    className="pl-9"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {profileForm.formState.errors.image && (
                  <p className="text-sm text-red-600">
                    {profileForm.formState.errors.image.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Permis de conduire</Label>
                <div className="flex gap-2">
                  {user.driverLicense ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleViewDriverLicense}
                        disabled={!user.driverLicense || isLicensePending}
                      >
                        {isLicensePending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Shield className="mr-2 h-4 w-4" />
                        )}
                        Voir le permis
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsLicenseDialogOpen(true)}
                        disabled={isDriverLicenseUploadBlocked}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Remplacer le permis
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLicenseDialogOpen(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Ajouter votre permis
                    </Button>
                  )}
                </div>
                {user.driverLicense && driverLicenseUploadInfo.remaining < DRIVER_LICENSE_MAX_REPLACEMENTS && (
                  <p className="text-xs text-muted-foreground">
                    Remplacements restants : {driverLicenseUploadInfo.remaining} / {DRIVER_LICENSE_MAX_REPLACEMENTS}
                  </p>
                )}
                {isDriverLicenseUploadBlocked && driverLicenseUploadInfo.nextAllowedAt && (
                  <p className="text-xs text-amber-600">
                    Limite atteinte. Prochain remplacement possible le {new Date(driverLicenseUploadInfo.nextAllowedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {licenseError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{licenseError}</span>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Changer le mot de passe
            </CardTitle>
            <CardDescription>Mettez à jour votre mot de passe pour sécuriser votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Message d'erreur pour le changement de mot de passe */}
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Message de succès pour le changement de mot de passe */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.currentPassword.message}
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
                    {...passwordForm.register("newPassword")}
                    className={`pl-9 pr-9 ${
                      newPassword && passwordErrors.newPassword
                        ? "border-red-500"
                        : newPassword && !passwordErrors.newPassword
                        ? "border-green-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? "text-green-600" : "text-gray-400"}`}>
                      {newPassword.length >= 8 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      Au moins 8 caractères
                    </div>
                    <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`}>
                      {/[A-Z]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      Une majuscule
                    </div>
                    <div className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`}>
                      {/[a-z]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      Une minuscule
                    </div>
                    <div className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`}>
                      {/[0-9]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      Un chiffre
                    </div>
                    <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-gray-400"}`}>
                      {/[^A-Za-z0-9]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      Un caractère spécial
                    </div>
                  </div>
                )}
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                    className={`pl-9 pr-9 ${
                      confirmPassword && passwordErrors.confirmPassword
                        ? "border-red-500"
                        : confirmPassword && newPassword === confirmPassword
                        ? "border-green-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Les mots de passe correspondent
                  </p>
                )}
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword || !passwordForm.formState.isValid}
              >
                {isChangingPassword ? "Modification..." : "Changer le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Suppression du compte */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Zone de danger
            </CardTitle>
            <CardDescription>Supprimer définitivement votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Message d'erreur pour la demande de suppression */}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Message de succès pour la demande de suppression */}
            {deleteSuccess && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5" />
                <span>{deleteSuccess}</span>
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
                <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletePassword">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deletePassword"
                        type={showDeletePassword ? "text" : "password"}
                        {...deleteForm.register("password")}
                        className="pl-9 pr-9"
                        placeholder="Entrez votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showDeletePassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {deleteForm.formState.errors.password && (
                      <p className="text-sm text-red-600">
                        {deleteForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmText">
                      Tapez <strong>SUPPRIMER</strong> pour confirmer
                    </Label>
                    <Input
                      id="confirmText"
                      {...deleteForm.register("confirmText")}
                      placeholder="SUPPRIMER"
                    />
                    {deleteForm.formState.errors.confirmText && (
                      <p className="text-sm text-red-600">
                        {deleteForm.formState.errors.confirmText.message}
                      </p>
                    )}
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      type="submit"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting || !deleteForm.formState.isValid}
                    >
                      {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Dialog pour uploader/remplacer le permis */}
        <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {user?.driverLicense ? "Remplacer le permis de conduire" : "Ajouter votre permis de conduire"}
              </DialogTitle>
              <DialogDescription>
                Téléversez un PDF sécurisé de votre permis de conduire. Le document est stocké dans un dossier privé.
              </DialogDescription>
            </DialogHeader>
            {user && (
              <ClientDriverLicenseUpload
                userName={user.name}
                existingUrl={user.driverLicense}
                uploadCount={driverLicenseUploadInfo.normalizedCount}
                lastUploadedAt={
                  driverLicenseUploadInfo.lastWithinWindow
                    ? driverLicenseUploadInfo.lastWithinWindow.toISOString()
                    : null
                }
                maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
                cooldownDays={DRIVER_LICENSE_COOLDOWN_DAYS}
                onUploaded={async () => {
                  // Recharger le profil pour mettre à jour les données
                  await fetchProfile();
                  setIsLicenseDialogOpen(false);
                  setSuccess(user.driverLicense ? "Permis de conduire remplacé avec succès" : "Permis de conduire ajouté avec succès");
                  setTimeout(() => setSuccess(null), 3000);
                }}
                onDismiss={() => setIsLicenseDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

