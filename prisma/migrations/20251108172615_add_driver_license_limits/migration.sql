-- AlterTable
ALTER TABLE "users" ADD COLUMN     "driverLicenseLastUploadedAt" TIMESTAMP(3),
ADD COLUMN     "driverLicensePublicId" TEXT,
ADD COLUMN     "driverLicenseUploadCount" INTEGER NOT NULL DEFAULT 0;
