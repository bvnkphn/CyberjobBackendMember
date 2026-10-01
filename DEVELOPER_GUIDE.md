# คู่มือนักพัฒนา (Developer Guide) — Architecture, Code Structure, Hostinger Deployment & Docker

> **สำหรับทีมพัฒนา (Developers & DevOps):** เอกสารนี้สรุปโครงสร้างโค้ดแยกตามกลุ่มผู้ใช้ (Member, Owner, Admin), รายละเอียดการตั้งค่าทั้งหมดบน Hostinger Production, ปัญหาที่พบและวิธีแก้ไข, ตลอดจนการใช้งาน Docker สำหรับ Development

---

## สารบัญ

1. [โครงสร้างโค้ดแยกตามบทบาทผู้ใช้ (Code Structure by User Role)](#1-โครงสร้างโค้ดแยกตามบทบาทผู้ใช้-code-structure-by-user-role)
   - 1.1 [ส่วนของผู้หางาน (Member / Jobseeker)](#11-ส่วนของผู้หางาน-member--jobseeker)
   - 1.2 [ส่วนของผู้ประกอบการ (Business Owner / Employer)](#12-ส่วนของผู้ประกอบการ-business-owner--employer)
   - 1.3 [ส่วนของผู้ดูแลระบบ (Admin)](#13-ส่วนของผู้ดูแลระบบ-admin)
   - 1.4 [ระบบกลางและสิทธิ์การเข้าใช้งาน (Auth Gateway & Security)](#14-ระบบกลางและสิทธิ์การเข้าใช้งาน-auth-gateway--security)
2. [คู่มือการ Deploy บน Hostinger Production อย่างละเอียด](#2-คู่มือการ-deploy-บน-hostinger-production-อย่างละเอียด)
   - 2.1 [สถาปัตยกรรมเซิร์ฟเวอร์บน Hostinger (LiteSpeed + Passenger)](#21-สถาปัตยกรรมเซิร์ฟเวอร์บน-hostinger-litespeed--passenger)
   - 2.2 [ผังไดเรกทอรีบนเซิร์ฟเวอร์ (Server Path Mapping)](#22-ผังไดเรกทอรีบนเซิร์ฟเวอร์-server-path-mapping)
   - 2.3 [การกำหนดค่า `.htaccess` สำหรับ Frontend และ Backend](#23-การกำหนดค่า-htaccess-สำหรับ-frontend-และ-backend)
   - 2.4 [ปัญหาสำคัญและทางแก้ (Hostinger Gotchas & Fixes)](#24-ปัญหาสำคัญและทางแก้-hostinger-gotchas--fixes)
   - 2.5 [การทำงานของสคริปต์อัตโนมัติ `deploy_update.py`](#25-การทำงานของสคริปต์อัตโนมัติ-deploy_updatepy)
   - 2.6 [ขั้นตอนการ Restart เซิร์ฟเวอร์ (Passenger Process Reload)](#26-ขั้นตอนการ-restart-เซิร์ฟเวอร์-passenger-process-reload)
3. [คู่มือการใช้งาน Docker สำหรับ Local Development](#3-คู่มือการใช้งาน-docker-สำหรับ-local-development)
   - 3.1 [โครงสร้างบริการใน `docker-compose.yml`](#31-โครงสร้างบริการใน-docker-composeyml)
   - 3.2 [การตั้งค่า Environment Variables (`.env`)](#32-การตั้งค่า-environment-variables-env)
   - 3.3 [คำสั่ง CLI ที่ใช้งานบ่อย](#33-คำสั่ง-cli-ที่ใช้งานบ่อย)
   - 3.4 [การจัดการ Database Migration & Seeding ด้วย Docker](#34-การจัดการ-database-migration--seeding-ด้วย-docker)

---

## 1. โครงสร้างโค้ดแยกตามบทบาทผู้ใช้ (Code Structure by User Role)

โค้ดของ CyberJob ในปัจจุบันใช้แนวคิด **Unified Project Architecture** โดยรวมทุกโมดูลไว้ในโฟลเดอร์หลัก `frontend/` และ `backend/` ดังนี้:

### 1.1 ส่วนของผู้หางาน (Member / Jobseeker)
ออกแบบสำหรับบุคคลทั่วไปที่เข้ามาค้นหาตำแหน่งงาน สมัครงาน และสร้างเรซูเม่ดิจิทัล

#### ฝั่ง Frontend (`frontend/src/`)
* **หน้าค้นหาและแสดงรายละเอียดงาน:**
  * `app/jobs/page.tsx` — หน้ารวมตำแหน่งงานพร้อมตัวกรอง (Experience, Category, Salary, WorkStyle)
  * `app/jobs/[id]/page.tsx` — หน้ารายละเอียดงานแบบเจาะลึก
* **ขั้นตอนการสมัครงาน (3-Step Application):**
  * `app/apply-step1/page.tsx` — ขั้นที่ 1: ตรวจสอบข้อมูลส่วนตัวและเลือกเรซูเม่ (ใช้เรซูเม่ในระบบ หรืออัปโหลดไฟล์ใหม่)
  * `app/apply-step2/page.tsx` — ขั้นที่ 2: ระบุทักษะ และตอบคำถามคัดกรอง (Screening Questions)
  * `app/apply-step3/page.tsx` — ขั้นที่ 3: ตรวจสอบความถูกต้องและส่งใบสมัคร
* **โปรไฟล์และเรซูเม่ดิจิทัล:**
  * `app/profile/page.tsx` — แดชบอร์ดโปรไฟล์ แสดงเรซูเม่ย่อ และการตั้งค่าความเป็นส่วนตัว
  * `app/profile/edit/page.tsx` — ฟอร์มแก้ไขประวัติการทำงาน การศึกษา ทักษะ และใบ Certificate
  * `app/profile/preview/page.tsx` — หน้าพรีวิวเรซูเม่ดิจิทัลสำหรับพิมพ์/บันทึก PDF
* **ฟีเจอร์ความเป็นส่วนตัว "มุดงาน (Hide Job)" & Always Allow:**
  * อยู่ในคอมโพเนนต์ `components/profile/` เชื่อมต่อไปยัง API `/api/me/privacy`
  * ซ่อนประวัติและเรซูเม่ของผู้สมัครไม่ให้ HR ของบริษัทปัจจุบันมองเห็น
* **การติดตามงานและคำเชิญ:**
  * `app/my-jobs/page.tsx` — รายการงานที่ส่งใบสมัครไปแล้ว พร้อมสถานะ (Submitted, Reviewing, Interview, Hired, Rejected)
  * `app/invitations/page.tsx` — รายการคำเชิญสมัครงานจากบริษัท พร้อมปุ่มตอบรับหรือปฏิเสธ

#### ฝั่ง Backend (`backend/apps/api/src/`)
* **`jobs/`** — `JobsController`, `JobsService` จัดการค้นหางาน, นับจำนวนเข้าชม, คำนวณช่วงเงินเดือน
* **`me/`** — `MeController`, `MeService` จัดการข้อมูลโปรไฟล์ของผู้หางาน, ทักษะ, ประวัติการศึกษา, ใบรับรอง, งานที่ Bookmark ไว้, และการตั้งค่าความเป็นส่วนตัว
* **Database Models (Prisma):**
  * `User` (role = `JOBSEEKER`)
  * `Resume`, `WorkExperience`, `Education`, `Certificate`, `Skill`
  * `Application` (บันทึกประวัติการสมัครงาน)
  * `Bookmark` (งานที่บันทึกไว้)

---

### 1.2 ส่วนของผู้ประกอบการ (Business Owner / Employer)
ออกแบบสำหรับบริษัทและฝ่ายบุคคล (HR) ในการลงประกาศงาน จัดการผู้สมัคร และเลือกแพ็กเกจ

#### ฝั่ง Frontend (`frontend/src/`)
* **แดชบอร์ดภาพรวม:**
  * `app/dashboard/page.tsx` — แสดงสถิติ Active Jobs, Total Applicants, Invitations และกราฟผู้เข้าชม
* **ระบบประกาศงาน (Markdown Editor + Real-time Preview):**
  * `app/job-postings/page.tsx` — ตารางรายการประกาศงานทั้งหมดของบริษัท (สถานะ Draft, Published, Closed)
  * `app/job-postings/create/page.tsx` — หน้าสร้างงานใหม่
  * `components/job-postings/JobPostingForm.tsx` — ฟอร์มระบุตำแหน่งงาน, สลับโหมดงานฝึกงาน / ไม่ระบุเงินเดือน, กล่องเขียนรายละเอียดงานด้วย **Markdown** พร้อมหน้าต่าง Preview แบบเรียลไทม์ และปุ่มช่วยใส่สัญลักษณ์ `##`
* **การจัดการผู้สมัครและ Smart Matching Score:**
  * `app/candidates/page.tsx` — หน้ารวมเรซูเม่ผู้สมัคร แสดงคะแนน Matching Score (%) พร้อมเหตุผลประกอบ
  * `app/candidates/responses/page.tsx` — หน้าตรวจคำตอบจากคำถามคัดกรองของผู้สมัคร
* **การยืนยันตัวตนบริษัทและเอกสารทางกฎหมาย:**
  * `app/company/page.tsx` — ฟอร์มข้อมูลบริษัท และการแนบเอกสาร (หนังสือรับรอง, บัตร ปชช. กรรมการ, รูปสำนักงาน, ภ.พ.20)
* **แพ็กเกจและการแจ้งชำระเงิน:**
  * `app/packages/page.tsx` — หน้าเลือกแพ็กเกจ (Starter, Gold, Platinum) และฟอร์มแนบสลิปโอนเงิน / PromptPay
* **ศูนย์ช่วยเหลือและวิดีโอ:**
  * `app/support/tutorials/page.tsx` — วิดีโอแนะนำการใช้งาน (YouTube Embed)

#### ฝั่ง Backend (`backend/apps/api/src/`)
* **`owner/`** — รวม API ของผู้ประกอบการทั้งหมดไว้ที่เดียว:
  * `owner-jobs.controller.ts` / `owner-jobs.service.ts` — จัดการ CRUD ประกาศงาน, การบันทึกสถานะ Draft/Published, คำถามคัดกรอง
  * `owner-candidates.controller.ts` / `owner-candidates.service.ts` — ระบบค้นหาผู้สมัคร, การ Bookmark ผู้สมัคร
  * `owner-invitations.controller.ts` — ส่งคำเชิญไปยังผู้สมัครงาน
  * `owner-payments.controller.ts` — รับข้อมูลการแจ้งโอนเงินและไฟล์รูปสลิป
  * `owner-company.controller.ts` — อัปโหลดเอกสารยืนยันตัวตนบริษัท
* **`src/common/matching.ts`** — อัลกอริทึม Smart Matching Score (คำนวณคะแนนความตรงกัน: ทักษะ 40%, ตำแหน่ง 25%, ประสบการณ์ 20%, ช่วงเงินเดือน 15%)
* **Database Models (Prisma):**
  * `Company` (สถานะ `verificationStatus: PENDING / APPROVED / REJECTED`)
  * `Job` (สถานะ `status: DRAFT / PUBLISHED / CLOSED`)
  * `ScreeningQuestion`, `ScreeningAnswer`
  * `CandidateBookmark`, `Invitation`
  * `SubscriptionPayment` (สลิปการโอนเงิน)

---

### 1.3 ส่วนของผู้ดูแลระบบ (Admin)
ออกแบบสำหรับเจ้าหน้าที่ผู้ดูแลระบบของ CyberJob เพื่อกำกับดูแลความเรียบร้อยของแพลตฟอร์ม

#### ฝั่ง Frontend (`frontend/src/`)
* **โครงสร้างหลังบ้าน:**
  * `app/admin/layout.tsx` — ครอบด้วย `AdminAuthProvider` และ `AdminShell`
  * `components/admin/shell/AdminShell.tsx` — โครงสร้างเมนู Sidebar, Header, และระบบ Direct Sign-In ของ Admin
  * `lib/admin/auth.tsx` — Context จัดการ Authentication ของ Admin โดยเฉพาะ
* **หน้างานของ Admin:**
  * `app/admin/page.tsx` — แดชบอร์ดสรุปตัวเลขสถิติภาพรวมทั้งระบบ
  * `app/admin/companies/page.tsx` และ `[id]/page.tsx` — ตรวจสอบเอกสารแนบ และอนุมัติ/ปฏิเสธบริษัท
  * `app/admin/jobs/page.tsx` — ตรวจสอบประกาศงานทั้งหมด และสั่งซ่อน/ลบงานที่ผิดกฎ
  * `app/admin/users/page.tsx` — จัดการผู้ใช้ทั้งหมด เปลี่ยนบทบาท (Role) และระงับบัญชี
  * `app/admin/packages/page.tsx` — ตรวจสอบรูปสลิปโอนเงิน และกดยืนยันอัปเกรดแพ็กเกจให้บริษัท
  * `app/admin/synonyms/page.tsx` — จัดการพจนานุกรมทักษะไซเบอร์ (จับคู่คำที่ความหมายเหมือนกัน เช่น Pentest = Penetration Testing)
  * `app/admin/settings/page.tsx` — ตั้งค่าระบบ และจัดการลิงก์ YouTube วิดีโอสอนการใช้งาน

#### ฝั่ง Backend (`backend/apps/api/src/`)
* **`admin/`** — `admin.controller.ts`, `admin.service.ts`:
  * ตรวจสอบ Guard ด้วย `Roles(UserRole.ADMIN)`
  * จัดการการอนุมัติบริษัท, อัปเดตสิทธิ์ผู้ใช้, จัดการ Synonyms, อนุมัติสลิปโอนเงิน
* **Bypass OTP Logic:** ใน `auth.service.ts` ถ้าผู้ใช้มี `role === 'ADMIN'` ระบบจะข้ามขั้นตอน OTP และออก Tokens ให้ทันที

---

### 1.4 ระบบกลางและสิทธิ์การเข้าใช้งาน (Auth Gateway & Security)
* **Frontend:**
  * `components/gate/login-form.tsx` — แบบฟอร์ม 2 ขั้นตอน (Step 1: อีเมล/รหัสผ่าน -> Step 2: กล่องกรอก OTP 6 ช่องแบบ Auto-focus, รองรับการ Paste รหัส 6 หลัก, นับถอยหลังขอรหัสใหม่ 60 วินาที)
  * `components/gate/google-button.tsx` — ระบบ Google Sign-In ผ่าน Google Identity Services (GIS)
* **Backend:**
  * `auth/auth.service.ts` — ระบบยืนยันตัวตน, ออก Access Token (JWT 15 นาที) + Refresh Token (30 วันใน httpOnly cookie)
  * `auth/otp.service.ts` — ระบบสร้างรหัสตัวเลข OTP 6 หลัก, อายุ 5 นาที, Cooldown 60 วินาที, จำกัดการใส่ผิดไม่เกิน 5 ครั้ง, ป้องกัน Replay Attack
  * `auth/mail.service.ts` — ระบบส่งอีเมล HTML Template สวยงามผ่าน SMTP ด้วย Nodemailer

---

## 2. คู่มือการ Deploy บน Hostinger Production อย่างละเอียด

### 2.1 สถาปัตยกรรมเซิร์ฟเวอร์บน Hostinger
* **ระบบปฏิบัติการ:** CloudLinux / CentOS
* **Web Server:** LiteSpeed Web Server (LSWS)
* **Application Server:** Phusion Passenger (ทำหน้าที่รัน Node.js processes)
* **Node.js Path:** `/opt/alt/alt-nodejs22/root/bin/node` (Node.js 22 LTS)
* **Production Domain:** `https://cyberjob.asia`

---

### 2.2 ผังไดเรกทอรีบนเซิร์ฟเวอร์ (Server Path Mapping)

```text
/home/u284966165/domains/cyberjob.asia/
├── public_html/                                  # Web Root ที่ LiteSpeed ชี้มา
│   ├── .htaccess                                 # [สำคัญ] คอนฟิกรัน Next.js Frontend
│   ├── api/                                      # โฟลเดอร์ Sub-application สำหรับ Backend API
│   │   ├── .htaccess                             # [สำคัญ] คอนฟิกรัน NestJS Backend
│   │   ├── dist/                                 # ไฟล์ compiled JavaScript ของ NestJS
│   │   ├── node_modules/                         # dependencies และ .prisma/client
│   │   ├── prisma/schema.prisma                  # ไฟล์ schema
│   │   └── .env                                  # environment variables ของ backend
│   └── tmp/
│       └── restart.txt                           # สัญญาณสั่ง Restart Root Passenger Process
│
└── hbuilds/current/nodejs/                       # โฟลเดอร์จริงของ Next.js Frontend
    ├── .next/                                    # Next.js Production Build
    ├── server.cjs                                # [สำคัญ] Custom Node.js Startup Wrapper
    ├── node_modules/                             # Frontend dependencies
    └── tmp/
        └── restart.txt                           # สัญญาณสั่ง Restart Frontend Process
```

---

### 2.3 การกำหนดค่า `.htaccess` สำหรับ Frontend และ Backend

#### 1) ไฟล์ `/home/.../public_html/.htaccess` (ควบคุม Next.js Frontend)
```apache
PassengerAppRoot /home/u284966165/domains/cyberjob.asia/hbuilds/current/nodejs
PassengerAppType node
PassengerRestartDir /home/u284966165/domains/cyberjob.asia/hbuilds/current/nodejs/tmp
SetEnv NODE_OPTIONS "--require /home/u284966165/domains/cyberjob.asia/hbuilds/config/preload-timestamp.js"
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile server.cjs
PassengerBaseURI /
SetEnv LSNODE_CONSOLE_LOG console.log
SetEnv TOKIO_WORKER_THREADS 2
```

#### 2) ไฟล์ `/home/.../public_html/api/.htaccess` (ควบคุม NestJS Backend API)
```apache
PassengerAppRoot /home/u284966165/domains/cyberjob.asia/public_html/api
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile dist/apps/api/src/main.js
PassengerBaseURI /api
SetEnv LSNODE_CONSOLE_LOG console.log
```

> [!WARNING]
> **ข้อควรระวังเรื่อง `PassengerBaseURI`:**
> * ในโฟลเดอร์ `api/` จะต้องใส่ `PassengerBaseURI /api` เสมอ
> * หากเผลอใส่เป็น `/` LiteSpeed จะเข้าใจว่า `api` คือแอปพลิเคชันหลัก และจะดักคำขอทั้งหมดของเว็บ (หน้าแรก, หน้างาม, หน้าแดชบอร์ด) วิ่งเข้า Backend ส่งผลให้เปิดหน้าเว็บไม่ได้ (ขึ้น Cannot GET /)

---

### 2.4 ปัญหาสำคัญและทางแก้ (Hostinger Gotchas & Fixes)

#### Gotcha 1: ปัญหา Next.js CWD ใน Passenger (`server.cjs` Fix)
* **ปัญหา:** เมื่อ Passenger ทำงานใน Subdirectory หรือรันจาก Web Root `public_html` ค่า `process.cwd()` ของ Node.js จะชี้ไปที่ `public_html` ทำให้ Next.js พยายามมองหาโฟลเดอร์ `.next` ใน `public_html` และพังด้วยข้อผิดพลาด:  
  `Cannot find module '/home/.../public_html/.next/required-server-files.json'`
* **ทางแก้:** ในไฟล์ `server.cjs` ต้องส่งพารามิเตอร์ `dir: __dirname` ให้แก่ Next.js เสมอ:
  ```javascript
  const next = require('next');
  const app = next({
    dev: false,
    hostname: '0.0.0.0',
    port: process.env.PORT || 3000,
    dir: __dirname  // <-- บังคับให้ Next.js อ่านไฟล์ .next จากโฟลเดอร์ของตัวเอง
  });
  ```

#### Gotcha 2: ห้ามรัน `npx prisma generate` บน Terminal ของ Hostinger
* **ปัญหา:** เซิร์ฟเวอร์ของ Hostinger มีการจำกัด Memory ต่องาน (Process Memory Limit) หากรัน `npx prisma generate` ตัวเอนจินของ Prisma จะกินแรมเกินลิมิตจนเกิดการแครช:  
  `Aborted (core dumped) SIGABRT`
* **ทางแก้:** ห้ามรัน prisma generate บนเซิร์ฟเวอร์โดยเด็ดขาด ให้รันบนเครื่อง Local แล้วซิปโฟลเดอร์ `backend/node_modules/.prisma/client` ไปแตกไฟล์ลงใน `node_modules/.prisma/client` บนเซิร์ฟเวอร์โดยตรง

#### Gotcha 3: Next.js ต้องการ `@types/` ตอน Startup บน Production
* **ปัญหา:** Next.js บน Hostinger อาจตรวจสอบแพ็กเกจ Types ตอนเริ่มทำงาน หากไม่มี `@types/react` หรือ `@types/node` จะไม่ยอมสตาร์ต
* **ทางแก้:** สคริปต์ deploy จะสั่ง `npm install --save-dev @types/react @types/react-dom '@types/node@20.17.6'` ไว้เสมอ

---

### 2.5 การทำงานของสคริปต์อัตโนมัติ `backend/scripts/deploy_update.py`
สคริปต์นี้พัฒนาขึ้นเพื่อให้ Developer สามารถ Deploy อัปเดตโค้ดขึ้น Production ได้ในคำสั่งเดียว:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Script as deploy_update.py
    participant Local as Local Machine
    participant Server as Hostinger Server (SSH/SFTP)
    participant Passenger as LiteSpeed Passenger

    Dev->>Script: python backend/scripts/deploy_update.py
    Script->>Local: Zip dist files -> backend_update.zip
    Script->>Local: Zip .next (no cache) -> frontend_next.zip
    Script->>Local: Zip .prisma/client -> prisma_client.zip
    Script->>Server: SFTP Upload ทั้ง 3 zip files
    Script->>Server: SSH Exec: แตกไฟล์ลงที่อยู่ปลายทาง
    Script->>Server: SSH Exec: npm install dependencies ที่จำเป็น
    Script->>Server: SSH Exec: touch tmp/restart.txt
    Server->>Passenger: Restart Worker Processes
    Script->>Local: ลบ zip ชั่วคราวออกจากเครื่อง
    Script-->>Dev: ALL DEPLOYMENT STEPS COMPLETED!
```

---

### 2.6 ขั้นตอนการ Restart เซิร์ฟเวอร์ (Passenger Process Reload)
หากต้องการสั่ง Restart ระบบด้วยตนเองผ่าน SSH:

```bash
# 1) Restart Backend API
mkdir -p /home/u284966165/domains/cyberjob.asia/public_html/api/tmp
touch /home/u284966165/domains/cyberjob.asia/public_html/api/tmp/restart.txt

# 2) Restart Frontend Web
mkdir -p /home/u284966165/domains/cyberjob.asia/hbuilds/current/nodejs/tmp
touch /home/u284966165/domains/cyberjob.asia/hbuilds/current/nodejs/tmp/restart.txt
touch /home/u284966165/domains/cyberjob.asia/public_html/.htaccess
```

---

## 3. คู่มือการใช้งาน Docker สำหรับ Local Development

สำหรับนักพัฒนาคนใหม่ที่ไม่ต้องการเชื่อมต่อระบบจริง หรือต้องการพัฒนาแบบแยกส่วน (Isolated Environment) สามารถใช้ Docker ได้ทันที

### 3.1 โครงสร้างบริการใน `docker-compose.yml`

ไฟล์ [docker-compose.yml](file:///d:/CyberJob_/docker-compose.yml) ที่ระดับ Root ประกอบด้วย 3 คอนเทนเนอร์หลัก:

```yaml
services:
  # 1. ฐานข้อมูล PostgreSQL สำหรับ Local
  postgres:
    image: postgres:16-alpine
    container_name: cyberjob-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: cyberjob
      POSTGRES_PASSWORD: cyberjob-local-pass
      POSTGRES_DB: cyberjob

  # 2. Backend NestJS REST API
  api:
    build:
      context: ./backend
      dockerfile: apps/api/Dockerfile
    container_name: cyberjob-api
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://cyberjob:cyberjob-local-pass@postgres:5432/cyberjob?schema=public
      WEB_ORIGIN: http://localhost:3000
      JWT_ACCESS_SECRET: local-dev-secret-key-min-32-chars-long!
      SEED_ON_START: "true"

  # 3. Frontend Next.js Web Application
  web:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: http://localhost:4000/api
    container_name: cyberjob-web
    ports:
      - "3000:3000"
    depends_on:
      - api
```

---

### 3.2 การตั้งค่า Environment Variables (`.env`)
คัดลอกไฟล์ตัวอย่างก่อนเริ่มต้น:
```bash
cp .env.example .env
```
ตรวจสอบค่าสำคัญ:
* `DATABASE_URL`: สำหรับชี้ไปยัง Container ฐานข้อมูล
* `NEXT_PUBLIC_API_URL`: ชี้ไปที่ `http://localhost:4000/api`
* `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: ระบุ Client ID สำหรับทดสอบ Google Sign-In

---

### 3.3 คำสั่ง CLI ที่ใช้งานบ่อย

```bash
# 1) เริ่มต้นรันระบบทั้งหมดในพื้นหลังพร้อม Build
docker compose up -d --build

# 2) ดู Log การทำงานของ Backend API
docker compose logs -f api

# 3) ดู Log การทำงานของ Frontend Web
docker compose logs -f web

# 4) ตรวจสอบสถานะการทำงานของคอนเทนเนอร์
docker compose ps

# 5) หยุดการทำงานทั้งหมด (ข้อมูลใน DB ยังคงอยู่)
docker compose down

# 6) หยุดการทำงานพร้อมลบ Volume ข้อมูลทิ้ง (Reset DB)
docker compose down -v
```

---

### 3.4 การจัดการ Database Migration & Seeding ด้วย Docker

เมื่อมีการเปลี่ยนแปลงในไฟล์ `schema.prisma` สามารถสั่ง Migration ผ่าน Docker ได้โดยตรง:

```bash
# รัน Prisma Generate ในคอนเทนเนอร์ api
docker compose exec api npm run prisma:generate -w @cyberjob/api

# รัน Migration เพื่อปรับโครงสร้างตาราง
docker compose exec api npm run prisma:migrate -w @cyberjob/api

# เติมข้อมูลตัวอย่าง (Seed Data)
docker compose exec api npm run db:seed
```

---
*เอกสารนี้จัดทำขึ้นเพื่อให้ Developer และทีมปฏิบัติการสามารถพัฒนา บำรุงรักษา และ Deploy ระบบ CyberJob ได้อย่างถูกต้องและรวดเร็ว*
