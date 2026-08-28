ALTER TABLE "User" ADD COLUMN "gateCompleted" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CandidateProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "address" TEXT,
  "desiredJobCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "privacy" TEXT NOT NULL DEFAULT 'private',
  "sections" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
