ALTER TABLE "User"
  ADD COLUMN "gateSkipped" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "gateCompletedAt" TIMESTAMP(3);

UPDATE "User"
SET "gateCompletedAt" = "updatedAt"
WHERE "gateCompleted" = true AND "gateCompletedAt" IS NULL;
