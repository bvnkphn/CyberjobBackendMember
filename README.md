# CyberJob — Backend API (NestJS + Prisma)

> **เทคโนโลยีหลัก:** NestJS 10, Prisma ORM 5.22.0, PostgreSQL 16 (Supabase Cloud), Passport JWT, Nodemailer, Google Auth Library  
> **ที่อยู่โปรเจกต์:** [backend/](file:///d:/CyberJob_/backend)  
> **Production API:** [https://cyberjob.asia/api](https://cyberjob.asia/api)  
> **GitLab Repository:** `cyberjobbackendmember/cyberjobbackendmember.git` (Branch: `main`)

---

## 1. ภาพรวมสถาปัตยกรรม Backend

Backend ของ CyberJob ทำหน้าที่เป็น API Gateway และศูนย์กลางประมวลผลข้อมูลของแพลตฟอร์มทั้งหมด โดยรวมบริการไว้ 4 ส่วนหลัก:
1. **Authentication & Security:** การล็อกอินด้วยรหัสผ่าน, ระบบ Two-Factor Authentication (OTP ส่งเข้าอีเมล), Google Sign-In Verification, และการจัดการ JWT Tokens
2. **Member Service:** ระบบค้นหาและกรองตำแหน่งงาน, ยื่นใบสมัครงาน 3 ขั้นตอน, จัดการประวัติและเรซูเม่, ระบบมุดงาน (Hide Job Privacy)
3. **Owner Service (`/apps/api/src/owner`):** แดชบอร์ดผู้ประกอบการ, สร้าง/แก้ไขงาน (Markdown), จับคู่ผู้สมัคร (Matching Score), ส่งคำเชิญ, แพ็กเกจและสลิปชำระเงิน
4. **Admin Service (`/apps/api/src/admin`):** ตรวจสอบและอนุมัติบริษัท, กำกับดูแลประกาศงาน, จัดการผู้ใช้, จัดการคำค้นหา (Synonyms), ตรวจสอบสลิปโอนเงิน

---

## 2. โครงสร้างโมดูล (Module Structure)

```text
apps/api/
├── prisma/
│   ├── schema.prisma              # Database Schema (468 บรรทัด ครอบคลุม 17 Enums และ 18 Models)
│   └── seed.ts                    # สคริปต์สร้างข้อมูลตัวอย่าง (บริษัท, งาน, แอดมิน, สมาชิก)
└── src/
    ├── admin/                     # โมดูลผู้ดูแลระบบ (AdminController, AdminService)
    ├── auth/
    │   ├── auth.controller.ts     # Endpoints: /login, /verify-login-otp, /resend-login-otp, /google/verify
    │   ├── auth.service.ts        # Logic การตรวจสอบสิทธิ์, สร้าง JWT, แยก Role Redirection
    │   ├── otp.service.ts         # การสุ่มรหัส OTP 6 หลัก, อายุ 5 นาที, คูลดาวน์ 60 วิ, ป้องกัน Replay
    │   ├── mail.service.ts        # บริการส่งอีเมล HTML Template สวยงามผ่าน SMTP
    │   └── dto/auth.dto.ts        # DTOs สำหรับ Validate ข้อมูลเข้าสู่ระบบและ OTP
    ├── common/                    # Decorators, Guards, Pipes, Interceptors
    ├── companies/                 # โมดูลบริษัทและการยืนยันเอกสาร
    ├── jobs/                      # โมดูลตำแหน่งงานและตัวกรองค้นหา
    ├── me/                        # ข้อมูลส่วนตัวของผู้ใช้งานและเรซูเม่
    ├── owner/                     # โมดูลผู้ประกอบการ (Jobs, Candidates, Packages, Subscriptions)
    ├── prisma/                    # PrismaModule และ PrismaService จัดการ Database Connection
    └── support/                   # โมดูลรับเรื่องติดต่อและฝ่ายบริการลูกค้า
```

---

## 3. รายการ Endpoints สำคัญ (Key API Endpoints)

### 3.1 การเข้าสู่ระบบและความปลอดภัย (`/api/auth`)
| Method | Path | หน้าที่ | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | ตรวจสอบรหัสผ่านเบื้องต้น | หากเป็น `JOBSEEKER` หรือ `EMPLOYER` จะสร้าง OTP และส่งอีเมล |
| `POST` | `/auth/verify-login-otp` | ยืนยันรหัส OTP 6 หลัก | ตรวจสอบ OTP และออกคู่ Access + Refresh Token |
| `POST` | `/auth/resend-login-otp` | ขอรหัส OTP ใหม่อีกครั้ง | มี Cooldown 60 วินาที ป้องกันการยิงซ้ำ |
| `POST` | `/auth/google/verify` | ยืนยัน Google ID Token | ตรวจสอบกับ Google OAuth2 API และออกคู่ Tokens ทันที |
| `POST` | `/auth/refresh` | หมุนคู่ Token ใหม่ | อ่าน Refresh Token จาก Cookie และออก Token ใหม่ |
| `POST` | `/auth/logout` | ออกจากระบบ | ล้าง Token และเพิกถอนสิทธิ์จากฐานข้อมูล |

### 3.2 ผู้ประกอบการ (`/api/owner`)
| Method | Path | หน้าที่ |
| :--- | :--- | :--- |
| `GET` | `/owner/overview` | สถิติภาพรวมแดชบอร์ดของผู้ประกอบการ |
| `GET/POST` | `/owner/jobs` | ดูรายการประกาศงาน และสร้างประกาศงานใหม่ (รองรับ Markdown) |
| `GET` | `/owner/candidates` | ค้นหารายชื่อผู้สมัคร พร้อมคะแนน Matching Score |
| `POST` | `/owner/invitations` | ส่งคำเชิญชวนผู้สมัครให้มายื่นงาน |
| `POST` | `/owner/payments` | ส่งสลิปการโอนเงินเพื่อขออัปเกรดแพ็กเกจ |

### 3.3 ผู้ดูแลระบบ (`/api/admin`)
| Method | Path | หน้าที่ |
| :--- | :--- | :--- |
| `GET` | `/admin/companies` | รายการบริษัทที่รอการอนุมัติเอกสาร |
| `PATCH` | `/admin/companies/:id/status` | อนุมัติ หรือ ปฏิเสธการยืนยันตัวตนของบริษัท |
| `GET/PATCH` | `/admin/jobs` | ตรวจสอบและกำกับดูแลประกาศงานทั้งหมดในระบบ |
| `GET/PATCH` | `/admin/users` | ตรวจสอบรายชื่อผู้ใช้งาน และจัดการสิทธิ์ (Role) |
| `GET/PATCH` | `/admin/packages/payments` | ตรวจสอบรูปสลิปและอนุมัติแพ็กเกจให้บริษัท |
| `GET/POST` | `/admin/synonyms` | จัดการกลุ่มคำพจนานุกรมคำค้นหาทักษะไซเบอร์ |

---

## 4. ฐานข้อมูลและการจัดการ Schema (Database & Prisma)

โปรเจกต์นี้เชื่อมต่อกับ **Supabase Cloud PostgreSQL**:
- **Prisma Client:** ตรึงเวอร์ชัน **5.22.0**
- รันสร้าง Client ด้วยคำสั่ง:
  ```bash
  npm run prisma:generate -w @cyberjob/api
  ```
- *คำเตือน:* บนเซิร์ฟเวอร์ Hostinger ห้ามรัน `npx prisma generate` ผ่าน Terminal เนื่องจากข้อจำกัด Memory (จะเกิด SIGABRT) สคริปต์ `deploy_update.py` จะทำการแพ็กโฟลเดอร์ `.prisma/client` จากเครื่องไปวางให้โดยอัตโนมัติ

---

## 5. การรันในเครื่องสำหรับนักพัฒนา (Local Development)

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

2. ตรวจสอบไฟล์ `.env` ใน `backend/apps/api/.env`:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
   JWT_SECRET="cyberjob-super-secret-jwt-key-2026"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="noreply.cyberjob@gmail.com"
   SMTP_PASS="your-app-password"
   ```

3. เริ่มต้นรัน Development Server:
   ```bash
   npm run start:dev -w @cyberjob/api
   ```
   API จะทำงานที่: `http://localhost:4000/api`

---

## 6. การ Deploy ขึ้น Production (Hostinger)

รันสคริปต์อัตโนมัติจากเครื่อง local:
```bash
python scripts/deploy_update.py
```
สคริปต์จะทำการ:
1. Build โค้ด TypeScript ให้เป็น JavaScript ในโฟลเดอร์ `dist`
2. รวม `.prisma/client` และ `node_modules` ที่จำเป็น
3. ส่งไฟล์ผ่าน SFTP ขึ้น `/home/.../nodejs/api`
4. อัปเดตไฟล์คอนฟิก `.htaccess` ของ Passenger และส่งสัญญาณ Restart Process
