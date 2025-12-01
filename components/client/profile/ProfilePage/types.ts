export type UserProfile = {
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

export type DriverLicenseUploadInfo = {
  normalizedCount: number;
  remaining: number;
  nextAllowedAt: Date | null;
  lastWithinWindow: Date | null;
};

