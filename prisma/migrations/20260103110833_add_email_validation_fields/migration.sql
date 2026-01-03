-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('VALID', 'INVALID', 'CATCH_ALL', 'UNKNOWN', 'NOT_VALIDATED');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validationMetadata" JSONB DEFAULT '{}',
ADD COLUMN     "validationScore" DOUBLE PRECISION,
ADD COLUMN     "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'NOT_VALIDATED';

-- CreateIndex
CREATE INDEX "Contact_validationStatus_idx" ON "Contact"("validationStatus");
