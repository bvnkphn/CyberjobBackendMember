# CyberJob Backend Member

NestJS REST API (`/api/v1`) สำหรับสมาชิก พร้อม PostgreSQL, TypeORM, JWT Bearer และ dependency สำหรับ OAuth 2.0

```bash
cp .env.example .env
npm install
npm run start:dev
```

รัน API + PostgreSQL: `docker compose up --build` และตรวจที่ `/api/v1/health` ค่าลับต้องเก็บใน GitLab CI/CD Variables หรือ secret manager ของ cloud

## Gate และ Profile API

ทุก endpoint ใช้ JWT Bearer token และบันทึกข้อมูลตาม `user_id` จาก token:

- `POST /api/v1/gate` บันทึก onboarding
- `POST /api/v1/gate/skip` ข้าม onboarding
- `GET /api/v1/profile` อ่านโปรไฟล์พร้อมเปอร์เซ็นต์ความสมบูรณ์
- `PATCH /api/v1/profile/:section` บันทึกแต่ละส่วนของประวัติ

ค่า `section`: `personal`, `desiredJob`, `educations`, `workExperiences`, `certificates`, `languages`, `otherSkills`

สร้างตารางด้วย `npm run migration:run` หลังตั้งค่า `DATABASE_URL` แล้ว
