-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "modificationDepositDifference" DOUBLE PRECISION,
ADD COLUMN     "modificationRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modificationRequestedAt" TIMESTAMP(3),
ADD COLUMN     "originalDepositPaid" DOUBLE PRECISION,
ADD COLUMN     "originalEndDate" TIMESTAMP(3),
ADD COLUMN     "originalStartDate" TIMESTAMP(3),
ADD COLUMN     "originalTotalPrice" DOUBLE PRECISION;
