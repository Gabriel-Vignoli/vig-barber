-- AlterTable
ALTER TABLE "password_reset_codes" ADD COLUMN     "failed_attempts" INTEGER NOT NULL DEFAULT 0;
