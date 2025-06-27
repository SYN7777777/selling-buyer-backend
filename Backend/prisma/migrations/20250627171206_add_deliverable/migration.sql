/*
  Warnings:

  - You are about to drop the column `uploadedAt` on the `Deliverable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Deliverable" DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
