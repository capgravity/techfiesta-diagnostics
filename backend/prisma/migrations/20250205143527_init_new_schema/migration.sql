-- CreateTable
CREATE TABLE "Doctor" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "specialty" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "age" INTEGER NOT NULL,
    "smoker" VARCHAR(3) NOT NULL,
    "alcoholConsumption" VARCHAR(10) NOT NULL,
    "neurologicalCondition" VARCHAR(3) NOT NULL,
    "dementiaStatus" VARCHAR(20) NOT NULL,
    "alzheimerPredictionScores" DOUBLE PRECISION[],
    "mriScanIds" INTEGER[],
    "gradCamIds" INTEGER[],
    "doctorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MriScan" (
    "id" SERIAL NOT NULL,
    "publicImageUrl" VARCHAR(255) NOT NULL,

    CONSTRAINT "MriScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradCamScan" (
    "id" SERIAL NOT NULL,
    "publicImageUrl" VARCHAR(255) NOT NULL,
    "mriScanId" INTEGER NOT NULL,

    CONSTRAINT "GradCamScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_email_key" ON "Doctor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GradCamScan_mriScanId_key" ON "GradCamScan"("mriScanId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradCamScan" ADD CONSTRAINT "GradCamScan_mriScanId_fkey" FOREIGN KEY ("mriScanId") REFERENCES "MriScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
