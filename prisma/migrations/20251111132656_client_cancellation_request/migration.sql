/*
  Warnings:

  - You are about to drop the column `pdfPublicId` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancellationPreviousStatus" "BookingStatus",
ADD COLUMN     "cancellationRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN     "cancellationRequestedRefundRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "pdfPublicId";
