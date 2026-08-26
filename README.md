# CyberJob – Backend

REST API ของแพลตฟอร์มหางาน CyberJob

| ส่วน | เทคโนโลยี |
| --- | --- |
| Framework | NestJS 10 |
| Database | PostgreSQL 16 + Prisma ORM 5.22 |
| API | REST (prefix `/api`) |
| Authentication | JWT (access + refresh) และ OAuth 2.0 (Google) |
| Deployment | Docker + docker compose |

```
.
├── apps/api/            NestJS + Prisma
│   └── prisma/          schema.prisma, seed.ts
├── packages/shared/     types + ข้อมูลตัวอย่าง (ใช้ร่วมกับฝั่ง frontend)
├── scripts/smoke.mjs    smoke test ยิง API จริง
└── docker-compose.yml   postgres + api
```

> `packages/shared` เป็นสำเนาเดียวกับใน repo ฝั่ง frontend
> เมื่อแก้ type ของ API ต้องอัปเดตทั้งสองฝั่งให้ตรงกัน

---

## เริ่มใช้งาน

### ทางที่ 1 – Docker (เร็วที่สุด)

```bash
cp .env.example .env                 # แก้ค่า secret ก่อนใช้จริง
SEED_ON_START=true docker compose up -d --build
```

API: http://localhost:4000/api · PostgreSQL: localhost:5432

### ทางที่ 2 – รันเองบนเครื่อง

ต้องมี **Node 20+** และ **PostgreSQL 16**

```bash
npm run setup                          # install + build shared + prisma generate
cp apps/api/.env.example apps/api/.env # แก้ DATABASE_URL ให้ตรงกับเครื่อง

npm run db:migrate                     # สร้างตาราง
npm run db:seed                        # เติมข้อมูลตัวอย่าง 10 บริษัท / 31 ประกาศงาน

npm run dev                            # http://localhost:4000/api
```

> ### ⚠️ ต้อง `npm install` ก่อนเสมอ
>
> โปรเจกต์นี้ตรึง **Prisma 5.22.0** ไว้ ถ้ารัน `npx prisma ...` โดยยังไม่ติดตั้ง dependency
> `npx` จะไปดาวน์โหลด Prisma 7.x มารันแทน แล้วขึ้น `Error code: P1012`
> เพราะ Prisma 7 ย้าย `url` ออกจาก schema ไปไว้ที่ `prisma.config.ts`
>
> ```bash
> npx prisma --version    # ต้องขึ้น 5.22.0
> ```

บัญชีตัวอย่างหลัง seed:

| อีเมล | รหัสผ่าน | สิทธิ์ |
| --- | --- | --- |
| demo@cyberjob.co.th | `Demo1234!` | ผู้หางาน |
| admin@cyberjob.co.th | `Admin1234!` | ผู้ดูแลระบบ |

---

## ฐานข้อมูล

`apps/api/prisma/schema.prisma`

| ตาราง | หน้าที่ |
| --- | --- |
| `Company` | บริษัท + ข้อมูลติดต่อ + พิกัด |
| `Job` | ประกาศงาน (มี index บน category / province / postedAt / ช่วงเงินเดือน) |
| `User` | ผู้ใช้ – รองรับทั้งสมัครเองและมาจาก OAuth |
| `RefreshToken` | เก็บ **hash** ของ refresh token เพื่อให้เพิกถอนได้ |
| `Bookmark` | งานที่ผู้ใช้บันทึกไว้ |
| `Application` | ประวัติการสมัครงาน |
| `SupportTicket` | เรื่องที่ส่งผ่านฟอร์มติดต่อฝ่ายสนับสนุน |

```bash
npm run db:migrate                     # สร้าง migration ใหม่จาก schema
npm run prisma:studio -w @cyberjob/api # เปิด GUI ดูข้อมูล
npm run db:reset                       # ล้างแล้วสร้างใหม่ (ระวัง! ข้อมูลหาย)
```

---

## Authentication

**JWT** – access token อายุ 15 นาที ส่งผ่าน `Authorization: Bearer <token>`;
refresh token อายุ 30 วันอยู่ใน **httpOnly cookie** และถูก**หมุนใหม่ทุกครั้งที่ refresh**
โดยของเดิมเป็นโมฆะทันที เก็บเฉพาะ sha256 hash ในฐานข้อมูลจึงเพิกถอนได้จริง

รหัสผ่านเก็บเป็น bcrypt hash (10 rounds)

**OAuth 2.0 (Google)** – ตั้ง 3 ค่าใน `apps/api/.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

สร้าง OAuth client ที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
ถ้าไม่ตั้งค่า endpoint `/auth/google` จะตอบ 501 พร้อมคำอธิบาย ส่วนการสมัคร/ล็อกอินด้วยอีเมลยังใช้ได้ปกติ

**web กับ api อยู่คนละโดเมน?** ตั้ง `COOKIE_SAMESITE=none` และ `COOKIE_SECURE=true` (ต้องเป็น HTTPS)

---

## API

### สาธารณะ

| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET | `/api/jobs` | ค้นหา + กรอง + เรียง + แบ่งหน้า |
| GET | `/api/jobs/suggest?q=` | Search Auto |
| GET | `/api/jobs/recommended?limit=` | ตำแหน่งงานแนะนำ |
| GET | `/api/jobs/:idOrSlug` | รายละเอียดงาน |
| GET | `/api/jobs/:idOrSlug/related` | งานที่แนะนำ |
| GET | `/api/companies` `/api/companies/:slug` | บริษัท |
| GET | `/api/companies/:slug/jobs` | งานทั้งหมดของบริษัท |
| GET | `/api/meta/filters` | ตัวเลือกทั้งหมดของแผงกรอง |
| GET | `/api/support/topics` · POST `/api/support` | ฟอร์มติดต่อฝ่ายสนับสนุน |

### Auth

| Method | Path |
| --- | --- |
| POST | `/api/auth/register` · `/api/auth/login` |
| POST | `/api/auth/refresh` · `/api/auth/logout` · `/api/auth/logout-all` |
| GET | `/api/auth/me` |
| GET | `/api/auth/google` → `/api/auth/google/callback` |

### ต้องล็อกอิน

| Method | Path |
| --- | --- |
| GET/POST | `/api/me/bookmarks` · DELETE `/api/me/bookmarks/:jobId` |
| POST | `/api/me/bookmarks/sync` |
| GET/POST | `/api/me/applications` |

ตัวอย่าง:

```
GET /api/jobs?q=dev&workStyle=hybrid,remote&province=กรุงเทพมหานคร,นนทบุรี
             &salaryMin=50000&experience=3-5&postedWithin=30&sort=salary_desc&page=1
```

---

## ทดสอบ

```bash
npm run smoke      # ยิง API จริง ~20 เคส (ต้องรัน API ที่ :4000 อยู่)
```

## CI/CD

`.gitlab-ci.yml` – typecheck → prisma validate → build → **ยก PostgreSQL จริงแล้วรัน smoke test**
→ สร้าง Docker image ขึ้น Container Registry → deploy ผ่าน SSH (manual)

CI/CD variables ที่ต้องตั้งก่อน deploy: `SSH_PRIVATE_KEY` (type File), `DEPLOY_HOST`, `DEPLOY_PATH`

---

## ต่อฐานข้อมูลจริง

ข้อมูล seed อ่านจาก `packages/shared/src/mock-jobs.ts`Copy-Item apps/api/.env.example apps/api/.env
npm run db:migrate
ส่วน logic ทั้งหมด query ผ่าน Prisma อยู่แล้ว — แก้ที่ `apps/api/src/jobs/jobs.service.ts`
และ `apps/api/src/companies/companies.service.ts` ได้โดยตรง
