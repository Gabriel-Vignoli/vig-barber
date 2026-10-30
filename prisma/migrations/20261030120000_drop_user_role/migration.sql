-- Phase 4c: staff roles live in Membership; the global User.role is gone.
-- Deploy only after the code that no longer reads User.role is live.

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- DropEnum
DROP TYPE "Role";
