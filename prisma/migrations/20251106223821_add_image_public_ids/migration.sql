-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "imagePublicIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
