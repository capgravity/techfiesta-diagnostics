/*
  Warnings:

  - You are about to drop the column `qualifications` on the `Doctor` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `Doctor` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `password` on the `Doctor` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `specialty` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "qualifications",
ADD COLUMN     "specialty" VARCHAR(255) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "alzheimerBiomarkers" TEXT[],
    "doctorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainScan" (
    "id" SERIAL NOT NULL,
    "scanType" VARCHAR(100),
    "scanDate" TIMESTAMP(3),
    "scanImage" TEXT,
    "tumorDetected" BOOLEAN,
    "tumorType" VARCHAR(100),
    "patientId" INTEGER NOT NULL,

    CONSTRAINT "BrainScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveTest" (
    "id" SERIAL NOT NULL,
    "testName" VARCHAR(100),
    "testDate" TIMESTAMP(3),
    "score" INTEGER,
    "interpretation" VARCHAR(255),
    "patientId" INTEGER NOT NULL,

    CONSTRAINT "CognitiveTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BrainScan_patientId_key" ON "BrainScan"("patientId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainScan" ADD CONSTRAINT "BrainScan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CognitiveTest" ADD CONSTRAINT "CognitiveTest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
