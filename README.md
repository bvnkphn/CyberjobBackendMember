# CyberJob — ศูนย์รวมตำแหน่งงานด้านความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity Job Platform)

> **Production URL:** [https://cyberjob.asia](https://cyberjob.asia)  
> **API Endpoint:** [https://cyberjob.asia/api](https://cyberjob.asia/api)  
> **Admin Portal:** [https://cyberjob.asia/admin](https://cyberjob.asia/admin)  
> **คู่มือการใช้งานสำหรับผู้ใช้:** [CYBERJOB_USER_MANUAL.md](CYBERJOB_USER_MANUAL.md)  
> **คู่มือนักพัฒนา (Architecture, Hostinger Deployment & Docker):** [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

---

## 1. ภาพรวมระบบ (System Architecture)

CyberJob เป็นแพลตฟอร์มแบบ **Unified Full-Stack Solution** ที่รวมระบบหลักทั้ง 3 ส่วน (ผู้หางาน, ผู้ประกอบการ, และผู้ดูแลระบบ) ไว้ในชุดโปรเจกต์เดียวกัน เพื่อความสะดวกในการพัฒนา จัดการ และ Deploy ขึ้นเซิร์ฟเวอร์ Hostinger ผ่าน Passenger:

| ส่วนประกอบ | เทคโนโลยีหลัก | หน้าที่รับผิดชอบ | เส้นทาง / URL |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 14+ (App Router), React, Google GIS, Lucide Icons | หน้าบ้านสำหรับ Member, Owner Dashboard, และ Admin Portal | `https://cyberjob.asia/` |
| **Backend** | NestJS 10, Prisma ORM 5.22, Passport JWT, Nodemailer | RESTful API, ระบบ OTP 2FA, การยืนยันสิทธิ์, จัดการข้อมูล | `https://cyberjob.asia/api` |
| **Database** | Supabase PostgreSQL 16 (Connection Pooler & Direct) | จัดเก็บข้อมูลผู้ใช้, ประกาศงาน, บริษัท, ใบสมัคร, สลิป, OTP | Remote Supabase Cloud |
| **Web Server** | LiteSpeed Web Server + Phusion Passenger | Reverse Proxy, Application Server, SSL Certificate | Hostinger Cloud Hosting |

---

## 2. โครงสร้างโฟลเดอร์ในระบบ (Directory Structure)

```text
D:\CyberJob_\
├── CYBERJOB_USER_MANUAL.md         # คู่มือการใช้งานเว็บฉบับสมบูรณ์ (ผู้ใช้, บริษัท, ผู้ดูแล)
├── README.md                       # เอกสารสถาปัตยกรรมและการติดตั้งระบบฉบับนี้
├── backend\                        # โค้ด Backend NestJS หลัก (รวม Member + Owner + Admin API)
│   ├── apps\
│   │   └── api\
│   │       ├── prisma\             # Prisma Schema 5.22 & Database Migrations
│   │       └── src\
│   │           ├── admin\          # โมดูล API สำหรับผู้ดูแลระบบ
│   │           ├── auth\           # ระบบ Authentication, Google OAuth, OTP 2FA, Mailer
│   │           ├── common\         # Guards, Decorators, Interceptors
│   │           ├── companies\      # ข้อมูลและเอกสารบริษัท
│   │           ├── jobs\           # ประกาศงานและการค้นหา
│   │           ├── me\             # โปรไฟล์ผู้ใช้งานและเรซูเม่
│   │           ├── owner\          # โมดูล API สำหรับผู้ประกอบการ (Jobs, Candidates, Packages)
│   │           └── support\        # ระบบคำร้องเรียนและฝ่ายบริการ
│   └── scripts\
│       ├── deploy_update.py        # สคริปต์อัตโนมัติสำหรับ Build & Deploy ขึ้น Hostinger
│       └── smoke.mjs               # สคริปต์รัน Smoke Test ตรวจสอบความถูกต้องของ API
├── frontend\                       # โค้ด Frontend Next.js หลัก (รวม Member + Owner + Admin UI)
│   ├── server.cjs                  # Custom Passenger Entry Point สำหรับ Next.js บน Hostinger
│   └── src\
│       ├── app\
│       │   ├── (public)\           # หน้าสาธารณะ (/, /jobs, /articles, /about, /contact)
│       │   ├── admin\              # หน้าศูนย์ควบคุมหลังบ้าน (/admin)
│       │   ├── dashboard\          # หน้าแดชบอร์ดหลักของผู้ประกอบการ (/dashboard)
│       │   ├── gate\               # หน้าเข้าสู่ระบบและสมัครสมาชิก (/gate/login, /gate/register)
│       │   ├── job-postings\       # ระบบจัดการและสร้างประกาศงานด้วย Markdown
│       │   ├── candidates\         # ระบบค้นหาและคัดเลือกผู้สมัครด้วย Matching Score
│       │   └── profile\            # ระบบจัดการโปรไฟล์ผู้หางานและฟังก์ชันมุดงาน
│       └── components\             # UI Components, Markdown Editor, Google Buttons
```

---

## 3. ระบบความปลอดภัยและการเข้าสู่ระบบ (Authentication & Security)

### 3.1 การเข้าสู่ระบบ 2 ขั้นตอน (Two-Factor Authentication: OTP)
- **ผู้หางาน (`JOBSEEKER`) และ ผู้ประกอบการ (`EMPLOYER`):**
  - ขั้นตอนที่ 1: กรอกอีเมลและรหัสผ่าน (ตรวจสอบความถูกต้องด้วย bcrypt 10 rounds)
  - ขั้นตอนที่ 2: ระบบจะสร้างรหัสตัวเลข OTP 6 หลัก และจัดส่งเข้าอีเมลทันที (รหัสมีอายุ 5 นาที, จำกัดเวลาขอใหม่ 60 วินาที, ป้องกัน Brute-force จำกัดใส่ผิดไม่เกิน 5 ครั้ง)
  - เมื่อกรอก OTP ถูกต้อง จึงจะได้รับคู่ JWT Tokens (Access Token + Refresh Token ใน httpOnly Cookie)
- **ผู้ดูแลระบบ (`ADMIN`):**
  - บัญชีผู้ดูแลระบบ (ADMIN) และบัญชีทดสอบทั้ง 3 บทบาท (Admin, Owner, Member) จะข้ามขั้นตอน OTP และเข้าสู่ระบบได้ทันทีเพื่อความสะดวกรวดเร็วในการทดสอบระบบ

### 3.2 การเข้าสู่ระบบด้วย Google Account (GIS)
- รองรับ Google One-Tap และ Google Sign-In Button
- Backend ตรวจสอบ ID Token โดยตรงกับ Google OAuth2 API (`google-auth-library`)
- ผูกบัญชีและกำหนด Role ให้อัตโนมัติตามแท็บที่ผู้ใช้เลือก

---

## 4. บัญชีเริ่มต้นสำหรับทดสอบระบบ (Default Test Accounts)

| บทบาท (Role) | อีเมล | รหัสผ่าน | สิทธิ์และการเข้าถึง |
| :--- | :--- | :--- | :--- |
| **ผู้ดูแลระบบ (Admin)** | `admin@cyberjob.co.th` | `Admin1234!` | เข้าถึงแดชบอร์ด `/admin` อนุมัติบริษัทและงานได้ทันที |
| **ผู้ประกอบการ (Owner)** | `testowner2fa@cyberjob.co.th` | `Test1234!` | แดชบอร์ด `/dashboard` จัดการงานและผู้สมัคร |
| **ผู้หางาน (Member)** | `testmember2fa@gmail.com` | `Test1234!` | ค้นหางาน สมัครงาน และจัดการเรซูเม่ |

---

## 5. การพัฒนาและรันบนเครื่อง Local (Local Development)

### ข้อกำหนดเบื้องต้น
- **Node.js:** เวอร์ชัน 20.x หรือ 22.x LTS
- **Prisma:** ตรึงเวอร์ชัน **5.22.0** (ห้ามอัปเดตเป็น Prisma 7.x เนื่องจากมี Breaking Changes กับ Schema)
- **การเชื่อมต่อฐานข้อมูล:** เข้าถึง Supabase PostgreSQL ได้

### 1) รัน Backend API
```bash
cd backend
npm install
npm run prisma:generate -w @cyberjob/api
npm run start:dev -w @cyberjob/api
```
- API จะพร้อมใช้งานที่: `http://localhost:4000/api`

### 2) รัน Frontend
```bash
cd frontend
npm install
npm run dev
```
- หน้าเว็บจะพร้อมใช้งานที่: `http://localhost:3000`

---

## 6. การ Deploy ขึ้น Production (Hostinger Cloud Server)

ระบบใช้สคริปต์อัตโนมัติภาษา Python ในการ Build, Zip, อัปโหลดผ่าน SFTP และสั่ง Restart Node.js Process บน Hostinger:

```bash
# จากโฟลเดอร์ backend/scripts/
python backend/scripts/deploy_update.py
```

### การตั้งค่าเซิร์ฟเวอร์และ Passenger (.htaccess)
- **Root Website (`public_html/.htaccess`):**
  - จัดการรัน Next.js ผ่าน `PassengerStartupFile server.cjs`
  - ส่งผ่าน Headers `X-Forwarded-Proto https`
- **Backend API (`public_html/api/.htaccess`):**
  - กำหนด `PassengerBaseURI /api` และ `PassengerAppRoot /home/.../nodejs/api`
  - รันไฟล์ `main.js` ของ NestJS

---

## 7. ข้อมูล Repository บน GitLab

| โมดูล | โฟลเดอร์ในเครื่อง | GitLab Repository | Branch ที่ใช้งาน |
| :--- | :--- | :--- | :---: |
| **Frontend รวมทั้งหมด** | `frontend/` | `cyberjobfrontendmember/cyberjobfrontendmember.git` | **`main`** |
| **Backend รวมทั้งหมด** | `backend/` | `cyberjobbackendmember/cyberjobbackendmember.git` | **`main`** |

---

## 8. การสนับสนุนและการติดต่อ (Support & Maintenance)

- สำหรับคู่มือการใช้งานแบบละเอียดทุกหน้าจอ โปรดอ่านที่ [CYBERJOB_USER_MANUAL.md](CYBERJOB_USER_MANUAL.md)
- ปัญหาทางเทคนิค: ติดต่อทีมพัฒนาระบบ CyberJob หรือผู้ดูแลระบบที่ `support@cyberjob.asia`
