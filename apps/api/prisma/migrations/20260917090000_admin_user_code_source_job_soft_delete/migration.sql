-- หลังบ้าน Admin (Feature 3 จัดการผู้ใช้ / Feature 5 จัดการประกาศงาน)

-- แหล่งที่มาของผู้สมัคร
CREATE TYPE "CandidateSource" AS ENUM ('CYBERPAY_INTERN', 'OUTSIDER');

ALTER TABLE "User"
  ADD COLUMN "candidateSource" "CandidateSource" NOT NULL DEFAULT 'OUTSIDER';

-- รหัสผู้ใช้แบบ CJ-0001 เรียงตามลำดับการสมัคร
CREATE SEQUENCE "User_code_seq";

-- ฟังก์ชันเรียก nextval ครั้งเดียว แล้วเติมศูนย์อย่างน้อย 4 หลักโดยไม่ตัดเลขที่ยาวกว่า
CREATE FUNCTION next_user_code() RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'CJ-' || lpad(n::text, greatest(4, length(n::text)), '0')
  FROM (SELECT nextval('"User_code_seq"') AS n) AS s
$$;

ALTER TABLE "User" ADD COLUMN "code" TEXT;

UPDATE "User" AS u
SET "code" = 'CJ-' || lpad(r.n::text, greatest(4, length(r.n::text)), '0')
FROM (SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS n FROM "User") AS r
WHERE u."id" = r."id";

SELECT setval('"User_code_seq"', (SELECT count(*) FROM "User") + 1, false);

ALTER TABLE "User"
  ALTER COLUMN "code" SET DEFAULT next_user_code(),
  ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "User_code_key" ON "User"("code");

-- ลบประกาศงานแบบ soft delete
ALTER TABLE "Job" ADD COLUMN "deletedAt" TIMESTAMP(3);
