/**
 * เติมข้อมูลตั้งต้นลง PostgreSQL จากชุดข้อมูลตัวอย่างใน @cyberjob/shared
 * รัน:  npm run db:seed -w @cyberjob/api
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { MOCK_COMPANIES, MOCK_JOBS } from '@cyberjob/shared';

const prisma = new PrismaClient();

/**
 * ตารางแปลง enum – เขียนซ้ำไว้ในไฟล์นี้โดยตั้งใจ
 * เพื่อให้ seed รันได้จาก image ที่มีแค่ dist (ไม่มีโฟลเดอร์ src)
 */
const toDbWorkStyle = (v: string) =>
  ({ onsite: 'ONSITE', hybrid: 'HYBRID', remote: 'REMOTE' })[v] as
    | 'ONSITE'
    | 'HYBRID'
    | 'REMOTE';

const toDbEmploymentType = (v: string) =>
  ({
    fulltime: 'FULLTIME',
    parttime: 'PARTTIME',
    contract: 'CONTRACT',
    temporary: 'TEMPORARY',
    internship: 'INTERNSHIP',
  })[v] as 'FULLTIME' | 'PARTTIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';

const toDbExperienceLevel = (v: string) =>
  ({
    '0': 'NONE',
    '1-2': 'ONE_TWO',
    '3-5': 'THREE_FIVE',
    '6-10': 'SIX_TEN',
    '10+': 'TEN_PLUS',
  })[v] as 'NONE' | 'ONE_TWO' | 'THREE_FIVE' | 'SIX_TEN' | 'TEN_PLUS';

async function main() {
  console.log('เริ่ม seed ข้อมูล...');

  /* ---------------- บริษัท ---------------- */
  for (const company of MOCK_COMPANIES) {
    const data = {
      slug: company.slug,
      name: company.name,
      legalName: company.legalName,
      logoText: company.logoText,
      logoColor: company.logoColor,
      verified: company.verified,
      businessType: company.businessType,
      employeeCount: company.employeeCount ?? null,
      about: company.about,
      email: company.contact.email,
      phone: company.contact.phone,
      website: company.contact.website,
      address: company.contact.address,
      province: company.province,
      district: company.district ?? null,
      coverImage: company.coverImage ?? null,
      gallery: company.gallery ?? [],
      lat: company.location?.lat ?? null,
      lng: company.location?.lng ?? null,
    };

    await prisma.company.upsert({
      where: { slug: company.slug },
      update: data,
      create: data,
    });
  }
  console.log(`  บริษัท: ${MOCK_COMPANIES.length} รายการ`);

  /* ---------------- ประกาศงาน ---------------- */
  for (const job of MOCK_JOBS) {
    const company = await prisma.company.findUniqueOrThrow({
      where: { slug: job.company.slug },
      select: { id: true },
    });

    const data = {
      slug: job.slug,
      title: job.title,
      companyId: company.id,
      category: job.category,
      subcategory: job.subcategory ?? null,
      province: job.province,
      district: job.district ?? null,
      workStyle: toDbWorkStyle(job.workStyle),
      employmentType: toDbEmploymentType(job.employmentType),
      experienceLevel: toDbExperienceLevel(job.experienceLevel),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryNegotiable: job.salaryNegotiable ?? false,
      postedAt: new Date(job.postedAt),
      isUrgent: job.isUrgent ?? false,
      summary: job.summary,
      description: job.description,
      requirements: job.requirements,
      additionalQualifications: job.additionalQualifications,
      employerAnswers: job.employerAnswers,
      benefits: job.benefits,
      skills: job.skills,
      openings: job.openings,
      coverImage: job.coverImage ?? null,
    };

    await prisma.job.upsert({
      where: { slug: job.slug },
      update: data,
      create: data,
    });
  }
  console.log(`  ประกาศงาน: ${MOCK_JOBS.length} รายการ`);

  /* ---------------- ผู้ใช้ตัวอย่าง ---------------- */
  const demoUsers = [
    {
      email: 'demo@cyberjob.co.th',
      name: 'ผู้ใช้ทดสอบ',
      password: 'Demo1234!',
      role: 'JOBSEEKER' as const,
    },
    {
      email: 'admin@cyberjob.co.th',
      name: 'ผู้ดูแลระบบ',
      password: 'Admin1234!',
      role: 'ADMIN' as const,
    },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
      },
    });
  }
  console.log(`  ผู้ใช้: ${demoUsers.length} รายการ (รหัสผ่านดูใน prisma/seed.ts)`);

  console.log('seed เสร็จเรียบร้อย');
}

main()
  .catch((error) => {
    console.error('seed ไม่สำเร็จ:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
