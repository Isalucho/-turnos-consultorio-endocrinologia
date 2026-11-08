-- CreateEnum
CREATE TYPE "ConsultType" AS ENUM ('PRIMERA', 'CONTROL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "amountPaid" INTEGER,
ADD COLUMN     "consultType" "ConsultType" NOT NULL DEFAULT 'CONTROL',
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "ClinicSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "firstConsultPrice" INTEGER NOT NULL DEFAULT 0,
    "followUpPrice" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicSettings_pkey" PRIMARY KEY ("id")
);

-- Los turnos ya cargados: el primer turno no cancelado de cada paciente es su primera consulta.
UPDATE "Appointment" a SET "consultType" = 'PRIMERA'
WHERE a."status" <> 'CANCELLED'
  AND NOT EXISTS (
    SELECT 1 FROM "Appointment" b
    WHERE b."patientId" = a."patientId"
      AND b."status" <> 'CANCELLED'
      AND b."id" <> a."id"
      AND (b."date", b."startTime", b."id") < (a."date", a."startTime", a."id")
  );
