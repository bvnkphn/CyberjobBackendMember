# CyberJob Backend Member

NestJS REST API (`/api/v1`) สำหรับสมาชิก พร้อม PostgreSQL, TypeORM, JWT Bearer และ dependency สำหรับ OAuth 2.0

```bash
cp .env.example .env
npm install
npm run start:dev
```

รัน API + PostgreSQL: `docker compose up --build` และตรวจที่ `/api/v1/health` ค่าลับต้องเก็บใน GitLab CI/CD Variables หรือ secret manager ของ cloud
