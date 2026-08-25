#!/bin/sh
set -e

echo "[entrypoint] รอ PostgreSQL พร้อมใช้งาน..."
attempt=0
max_attempts=${DB_WAIT_ATTEMPTS:-30}
until npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQL' >/dev/null 2>&1
SELECT 1;
SQL
do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "[entrypoint] เชื่อมต่อฐานข้อมูลไม่ได้หลังลอง $max_attempts ครั้ง – ตรวจ DATABASE_URL"
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] เชื่อมต่อฐานข้อมูลได้แล้ว"

# มี migration ที่ commit ไว้ → ใช้ migrate deploy (แนะนำสำหรับ production)
# ยังไม่มี → ใช้ db push เพื่อสร้างตารางจาก schema.prisma ให้ใช้งานได้ทันที
if [ -d prisma/migrations ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "[entrypoint] รัน prisma migrate deploy"
  npx prisma migrate deploy --schema prisma/schema.prisma
else
  echo "[entrypoint] ยังไม่มี migration – ใช้ prisma db push แทน"
  npx prisma db push --schema prisma/schema.prisma --skip-generate
fi

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] เติมข้อมูลตั้งต้น (seed)"
  npx prisma db seed
fi

exec "$@"
