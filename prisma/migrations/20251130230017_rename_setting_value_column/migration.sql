-- Rename column value to setting_value to avoid conflict with Prisma Studio CTE
ALTER TABLE "settings" RENAME COLUMN "value" TO "setting_value";
