/*
  Warnings:

  - You are about to drop the column `cancelled_at` on the `subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "cancelled_at",
ADD COLUMN     "auto_renew_disabled_at" TIMESTAMP(3);
