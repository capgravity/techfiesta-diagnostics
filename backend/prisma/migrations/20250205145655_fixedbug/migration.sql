/*
  Warnings:

  - You are about to drop the column `gradCamIds` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `mriScanIds` on the `Patient` table. All the data in the column will be lost.
  - Added the required column `patientId` to the `GradCamScan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `MriScan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GradCamScan" ADD COLUMN     "patientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MriScan" ADD COLUMN     "patientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "gradCamIds",
DROP COLUMN "mriScanIds";

-- AddForeignKey
ALTER TABLE "MriScan" ADD CONSTRAINT "MriScan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradCamScan" ADD CONSTRAINT "GradCamScan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
