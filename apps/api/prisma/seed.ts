/**
 * เติมข้อมูลตั้งต้นลง PostgreSQL จากชุดข้อมูลตัวอย่างใน @cyberjob/shared
 * รัน:  npm run db:seed -w @cyberjob/api
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { MOCK_COMPANIES, MOCK_JOBS } from '@cyberjob/shared';

// schema.prisma ใช้ engineType = "client" ซึ่งบังคับให้ต้องส่ง driver adapter
// เหมือนที่ PrismaService ทำ มิฉะนั้นจะขึ้น P2038 "Missing configured driver adapter"
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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

/**
 * ไม่ใช้ prisma.user.upsert เพราะ Prisma แปลงเป็น INSERT ... ON CONFLICT
 * ซึ่ง Postgres คำนวณ DEFAULT next_user_code() ก่อนรู้ว่าชน
 * seed ซ้ำทุกครั้งที่ container เริ่มจึงเผารหัส CJ-xxxx ทิ้งโดยไม่ได้ใช้
 */
async function upsertUserByEmail(
  email: string,
  update: Prisma.UserUpdateInput,
  create: Prisma.UserCreateInput,
) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return existing
    ? prisma.user.update({ where: { id: existing.id }, data: update })
    : prisma.user.create({ data: create });
}

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

  /* ---------------- ผู้ใช้ตัวอย่าง (เฉพาะเมื่อเปิดใช้โดยชัดเจน) ---------------- */
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

  if (process.env.SEED_DEMO_USERS === 'true') {
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await upsertUserByEmail(
        user.email,
        { name: user.name, role: user.role },
        { email: user.email, name: user.name, passwordHash, role: user.role },
      );
    }
    console.log(`  ผู้ใช้: ${demoUsers.length} รายการ (บัญชีทดสอบ)`);
  } else {
    console.log('  ผู้ใช้: ข้ามบัญชีทดสอบ (ตั้ง SEED_DEMO_USERS=true เพื่อเปิดใช้)');
  }


  /* ---------------- ผู้สมัครตัวอย่างสำหรับหลังบ้าน Admin (Feature 3) ---------------- */
  if (process.env.SEED_DEMO_USERS === 'true') {
    const candidates = buildDemoCandidates();
    const passwordHash = await bcrypt.hash('Candidate1234!', 10);
    for (const candidate of candidates) {
      const user = await upsertUserByEmail(
        candidate.email,
        {
          name: candidate.name,
          candidateSource: candidate.source,
          gateCompleted: candidate.evaluated,
        },
        {
          email: candidate.email,
          name: candidate.name,
          passwordHash,
          role: 'JOBSEEKER',
          candidateSource: candidate.source,
          gateCompleted: candidate.evaluated,
          gateCompletedAt: candidate.evaluated ? new Date() : null,
        },
      );
      await prisma.candidateProfile.upsert({
        where: { userId: user.id },
        update: {
          sections: candidate.sections,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          address: candidate.address,
        },
        create: {
          userId: user.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          address: candidate.address,
          sections: candidate.sections,
        },
      });
    }
    console.log(`  ผู้สมัครตัวอย่าง: ${candidates.length} รายการ`);
  }

  console.log('seed เสร็จเรียบร้อย');
}

main()
  .catch((error) => {
    console.error('seed ไม่สำเร็จ:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


/* ------------------------------------------------------------------ */
/* ข้อมูลผู้สมัครตัวอย่าง (ปี พ.ศ. ตามฟอร์มโปรไฟล์ฝั่งสมาชิก)           */
/* ไม่ได้กำหนดคะแนนเรซูเม่ตรง ๆ แต่ละคนตัดบางฟิลด์ออก (omit)           */
/* แล้วให้ระบบคำนวณจากความครบถ้วนจริง                                 */
/* ------------------------------------------------------------------ */

type DemoCandidate = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  address: string;
  source: 'CYBERPAY_INTERN' | 'OUTSIDER';
  /** false = ยังไม่ผ่านขั้น Gate จึงยังไม่ประเมินคะแนนเรซูเม่ */
  evaluated: boolean;
  sections: Record<string, Record<string, string>>;
};

const LANGUAGE_FIELDS = [
  'language1Name',
  'language1Listening',
  'language1Speaking',
  'language1Reading',
  'language1Writing',
];
const NO_CERTIFICATE = ['certificate1Title', 'certificate1Issuer', 'certificate1FileName'];

function buildDemoCandidates(): DemoCandidate[] {
  const currentBE = new Date().getFullYear() + 543;
  const rows: Array<{
    email: string;
    first: string;
    last: string;
    position: string;
    years: number;
    source: 'CYBERPAY_INTERN' | 'OUTSIDER';
    evaluated: boolean;
    omit: string[];
    certificates?: Array<[string, string]>;
  }> = [
    {
      email: 'anucha.m@example.com', first: 'อนุชา', last: 'มั่นคง', position: 'วิศวกร DevOps',
      years: 6, source: 'OUTSIDER', evaluated: true,
      omit: ['projects', 'workplacePreference', 'education1Major'],
      certificates: [
        ['AWS Solutions Architect', 'Amazon Web Services'],
        ['Google Cloud Professional', 'Google'],
        ['Scrum Master', 'Scrum Alliance'],
      ],
    },
    {
      email: 'somchai.j@example.com', first: 'สมชาย', last: 'ใจดี', position: 'นักพัฒนา Backend',
      years: 3, source: 'CYBERPAY_INTERN', evaluated: true,
      omit: [...NO_CERTIFICATE, 'projects', 'language1Listening', 'language1Speaking', 'language1Reading', 'language1Writing'],
    },
    {
      email: 'kittaya.p@example.com', first: 'กฤตยา', last: 'พร้อมพัฒนา', position: 'นักวิเคราะห์ความปลอดภัย',
      years: 2, source: 'OUTSIDER', evaluated: true,
      omit: [...NO_CERTIFICATE, ...LANGUAGE_FIELDS, 'projects', 'workplacePreference', 'availableStartDate'],
    },
    {
      email: 'manat.w@example.com', first: 'มนัส', last: 'วงศ์สกุล', position: 'นักพัฒนา Frontend',
      years: 2, source: 'CYBERPAY_INTERN', evaluated: true,
      omit: [...NO_CERTIFICATE, ...LANGUAGE_FIELDS, 'projects', 'specialty1', 'workplacePreference',
        'availableStartDate', 'education1Faculty', 'education1Major', 'gender'],
    },
    {
      email: 'supawadee.k@example.com', first: 'สุภาวดี', last: 'เกียรติศักดิ์', position: 'นักพัฒนาซอฟต์แวร์',
      years: 2, source: 'CYBERPAY_INTERN', evaluated: false, omit: [],
    },
    {
      email: 'pakpoom.s@example.com', first: 'ภาคภูมิ', last: 'สุขใจ', position: 'วิศวกรระบบเครือข่าย',
      years: 5, source: 'CYBERPAY_INTERN', evaluated: true,
      omit: [...NO_CERTIFICATE, 'projects', 'education1Major'],
    },
    {
      email: 'somying.r@example.com', first: 'สมหญิง', last: 'รักไทย', position: 'นักวิเคราะห์ข้อมูล',
      years: 1, source: 'CYBERPAY_INTERN', evaluated: true,
      omit: [...NO_CERTIFICATE, ...LANGUAGE_FIELDS, 'projects', 'specialty1', 'workplacePreference',
        'availableStartDate', 'education1Faculty'],
    },
    {
      email: 'teerapong.j@example.com', first: 'ธีรพงษ์', last: 'จริงใจ', position: 'ผู้ดูแลระบบ IT',
      years: 3, source: 'OUTSIDER', evaluated: false, omit: [],
    },
    {
      email: 'wichai.t@example.com', first: 'วิชัย', last: 'ตั้งใจ', position: 'ผู้เชี่ยวชาญ Cyber Security',
      years: 4, source: 'CYBERPAY_INTERN', evaluated: true,
      omit: [...NO_CERTIFICATE, 'projects', 'workplacePreference', 'education1Faculty'],
    },
    {
      email: 'pimjai.o@example.com', first: 'พิมพ์ใจ', last: 'อ่อนหวาน', position: 'IT Support',
      years: 0, source: 'CYBERPAY_INTERN', evaluated: true,
      omit: [...NO_CERTIFICATE, ...LANGUAGE_FIELDS, 'projects', 'specialty1', 'education1Level',
        'education1Institution', 'education1Faculty', 'education1Year', 'education1Major', 'education1Gpa',
        'workplacePreference', 'availableStartDate', 'gender'],
    },
    {
      email: 'paweena.s@example.com', first: 'ปวีณา', last: 'ศรีสุข', position: 'นักพัฒนา Backend',
      years: 1, source: 'CYBERPAY_INTERN', evaluated: false, omit: [],
    },
    {
      email: 'narawit.u@example.com', first: 'นราวิชญ์', last: 'อุตสาหะ', position: 'วิศวกรความปลอดภัยไซเบอร์',
      years: 4, source: 'OUTSIDER', evaluated: false, omit: [],
    },
  ];

  return rows.map((row) => {
    const address = '123 ถนนสุขุมวิท กรุงเทพมหานคร 10110';
    const certificates = row.certificates ?? [['ใบรับรองการอบรมความปลอดภัยไซเบอร์', 'CyberJob Academy']];

    const sections: Record<string, Record<string, string>> = {
      personal: {
        firstName: row.first, lastName: row.last, gender: 'ไม่ระบุ', birthDay: '12', birthMonth: '5',
        birthYear: '2540', nationality: 'ไทย', phone: '081-234-5678', address,
      },
      desiredJob: {
        desiredPosition1: row.position, desiredJobType1: 'งานประจำ',
        workplacePreference: 'ไฮบริด', availableStartDate: 'ทันที',
      },
      educations: {
        education1Level: 'ปริญญาตรี', education1Institution: 'จุฬาลงกรณ์มหาวิทยาลัย',
        education1Faculty: 'วิทยาศาสตร์', education1Major: 'วิทยาการคอมพิวเตอร์',
        education1Year: String(currentBE - row.years - 1), education1Gpa: '3.25',
      },
      workExperiences:
        row.years > 0
          ? {
              workExperience1StartMonth: '1',
              workExperience1StartYear: String(currentBE - row.years),
              workExperience1EndMonth: '',
              workExperience1EndYear: '',
              workExperience1Company: 'บริษัท เทคโซลูชั่นส์ จำกัด',
              workExperience1Position: row.position,
              workExperience1Description: 'พัฒนาและดูแลระบบให้ทีมผลิตภัณฑ์',
            }
          : {},
      languages: {
        language1Name: 'อังกฤษ', language1Listening: 'ดี', language1Speaking: 'ดี',
        language1Reading: 'ดีมาก', language1Writing: 'ดี',
      },
      certificates: Object.fromEntries(
        certificates.flatMap(([title, issuer], index) => [
          [`certificate${index + 1}Title`, title],
          [`certificate${index + 1}Issuer`, issuer],
          [`certificate${index + 1}FileName`, `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`],
        ]),
      ),
      otherSkills: {
        specialty1: 'Front-end: HTML, CSS, JavaScript',
        projects: 'ระบบแดชบอร์ดวิเคราะห์ข้อมูลภายในองค์กร',
      },
    };

    for (const field of row.omit) {
      for (const section of Object.values(sections)) delete section[field];
    }

    return {
      email: row.email,
      name: `${row.first} ${row.last}`,
      firstName: row.first,
      lastName: row.last,
      address,
      source: row.source,
      evaluated: row.evaluated,
      sections,
    };
  });
}
