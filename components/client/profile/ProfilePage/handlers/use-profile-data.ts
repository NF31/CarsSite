import { useState, useEffect, useMemo } from "react";
import { getProfileAction } from "@/actions/profile";
import type { UserProfile, DriverLicenseUploadInfo } from "../types";

const DRIVER_LICENSE_MAX_REPLACEMENTS = 3;
const DRIVER_LICENSE_COOLDOWN_DAYS = 21;

export function useProfileData() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculer les informations de remplacement du permis
  const driverLicenseUploadInfo = useMemo<DriverLicenseUploadInfo>(() => {
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

  const fetchProfile = async () => {
    try {
      const result = await getProfileAction();
      if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement du profil");
      }
      if (result.user) {
        const userData = result.user as UserProfile;
        setUser(userData);
        return { user: userData };
      }
      return null;
    } catch {
      setError("Erreur lors du chargement du profil");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    user,
    setUser,
    isLoading,
    error,
    fetchProfile,
    driverLicenseUploadInfo,
    isDriverLicenseUploadBlocked,
    DRIVER_LICENSE_MAX_REPLACEMENTS,
    DRIVER_LICENSE_COOLDOWN_DAYS,
  };
}

