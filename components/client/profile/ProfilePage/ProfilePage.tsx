"use client";

import { ClientBreadcrumbs } from "@/components/client/Breadcrumbs";
import { useProfileData } from "./handlers/use-profile-data";
import { useProfileForm } from "./handlers/use-profile-form";
import { usePasswordForm } from "./handlers/use-password-form";
import { useDeleteAccount } from "./handlers/use-delete-account";
import { useDriverLicense } from "./handlers/use-driver-license";
import { PersonalInfoCard } from "./components/personal-info-card";
import { DriverLicenseSection } from "./components/driver-license-section";
import { PasswordChangeCard } from "./components/password-change-card";
import { DeleteAccountCard } from "./components/delete-account-card";
import { DriverLicenseDialog } from "./components/driver-license-dialog";
import { ProfileMessages } from "./components/profile-messages";

export function ProfilePage() {
  const {
    user,
    setUser,
    isLoading,
    error: profileError,
    fetchProfile,
    driverLicenseUploadInfo,
    isDriverLicenseUploadBlocked,
    DRIVER_LICENSE_MAX_REPLACEMENTS,
    DRIVER_LICENSE_COOLDOWN_DAYS,
  } = useProfileData();

  const {
    form: profileForm,
    onSubmit: onProfileSubmit,
    isSaving,
    error: profileFormError,
    success: profileSuccess,
    setSuccess: setProfileSuccess,
    showPhoneValid,
    setShowPhoneValid,
  } = useProfileForm(user, setUser);

  const {
    form: passwordForm,
    onSubmit: onPasswordSubmit,
    isChangingPassword,
    error: passwordError,
    success: passwordSuccess,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  } = usePasswordForm();

  const {
    form: deleteForm,
    onSubmit: onDeleteSubmit,
    isDeleting,
    error: deleteError,
    success: deleteSuccess,
    showDeletePassword,
    setShowDeletePassword,
  } = useDeleteAccount();

  const {
    licenseError,
    isLicensePending,
    isLicenseDialogOpen,
    setIsLicenseDialogOpen,
    handleViewDriverLicense,
  } = useDriverLicense();

  const handleProfileSubmit = onProfileSubmit;

  const handleLicenseUploaded = async () => {
    const result = await fetchProfile();
    setIsLicenseDialogOpen(false);
    if (result?.user) {
      setUser(result.user);
      const message = result.user.driverLicense
        ? "Permis de conduire remplacé avec succès"
        : "Permis de conduire ajouté avec succès";
      setProfileSuccess(message);
      setTimeout(() => setProfileSuccess(null), 3000);
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

  if (!user) {
    return (
      <div className="container py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-red-600">Erreur lors du chargement du profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 sm:px-6 max-w-4xl">
      <div className="space-y-6">
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

        <ProfileMessages error={profileError || profileFormError} success={profileSuccess} />

        <PersonalInfoCard
          user={user}
          form={profileForm}
          onSubmit={handleProfileSubmit}
          isSaving={isSaving}
          showPhoneValid={showPhoneValid}
          setShowPhoneValid={setShowPhoneValid}
          driverLicenseSection={
            <DriverLicenseSection
              user={user}
              driverLicenseUploadInfo={driverLicenseUploadInfo}
              isDriverLicenseUploadBlocked={isDriverLicenseUploadBlocked}
              isLicensePending={isLicensePending}
              licenseError={licenseError}
              maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
              onViewLicense={() => handleViewDriverLicense(!!user.driverLicense)}
              onOpenDialog={() => setIsLicenseDialogOpen(true)}
            />
          }
        />

        <PasswordChangeCard
          form={passwordForm}
          onSubmit={onPasswordSubmit}
          isChangingPassword={isChangingPassword}
          error={passwordError}
          success={passwordSuccess}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />

        <DeleteAccountCard
          form={deleteForm}
          onSubmit={onDeleteSubmit}
          isDeleting={isDeleting}
          error={deleteError}
          success={deleteSuccess}
          showDeletePassword={showDeletePassword}
          setShowDeletePassword={setShowDeletePassword}
        />

        <DriverLicenseDialog
          isOpen={isLicenseDialogOpen}
          onOpenChange={setIsLicenseDialogOpen}
          user={user}
          driverLicenseUploadInfo={driverLicenseUploadInfo}
          maxReplacements={DRIVER_LICENSE_MAX_REPLACEMENTS}
          cooldownDays={DRIVER_LICENSE_COOLDOWN_DAYS}
          onUploaded={handleLicenseUploaded}
        />
      </div>
    </div>
  );
}

