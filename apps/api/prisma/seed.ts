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
    {
      // ผู้ประกอบการที่ยืนยันบริษัทแล้ว มีประกาศงานและผู้สมัครให้ลองใช้หลังบ้าน Owner
      email: 'owner@cyberjob.co.th',
      name: 'ผู้ประกอบการทดสอบ',
      password: 'Owner1234!',
      role: 'EMPLOYER' as const,
    },
    {
      // ผู้ประกอบการที่ยังไม่ได้กรอกข้อมูลบริษัท – ใช้ลองหน้า Gate
      email: 'newowner@cyberjob.co.th',
      name: 'ผู้ประกอบการรายใหม่',
      password: 'Owner1234!',
      role: 'EMPLOYER' as const,
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
          privacy: candidate.privacy,
        },
        create: {
          userId: user.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          address: candidate.address,
          privacy: candidate.privacy,
          sections: candidate.sections,
        },
      });
    }
    console.log(`  ผู้สมัครตัวอย่าง: ${candidates.length} รายการ`);

    await seedOwnerDemo();
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
  /** private = ไม่แสดงในการค้นหาผู้สมัครทั้งระบบของผู้ประกอบการ */
  privacy: 'public' | 'private';
  sections: Record<string, Record<string, string>>;
};

/** ทักษะเด่นตามตำแหน่ง – ใช้ทั้งตัวกรองทักษะและ Matching Score ฝั่ง Owner */
const SKILLS_BY_POSITION: Record<string, [string, string, string]> = {
  'วิศวกร DevOps': ['Docker', 'Kubernetes', 'AWS'],
  'นักพัฒนา Backend': ['Node.js', 'NestJS', 'PostgreSQL'],
  'นักวิเคราะห์ความปลอดภัย': ['SIEM', 'Penetration Testing', 'Network Security'],
  'นักพัฒนา Frontend': ['React', 'TypeScript', 'Next.js'],
  'นักพัฒนาซอฟต์แวร์': ['Java', 'Spring Boot', 'SQL'],
  'วิศวกรระบบเครือข่าย': ['Cisco', 'Network Security', 'Firewall'],
  'นักวิเคราะห์ข้อมูล': ['SQL', 'Python', 'Power BI'],
  'ผู้ดูแลระบบ IT': ['Windows Server', 'Active Directory', 'Linux'],
  'ผู้เชี่ยวชาญ Cyber Security': ['Penetration Testing', 'ISO 27001', 'SIEM'],
  'IT Support': ['Troubleshooting', 'Windows', 'Networking'],
  'วิศวกรความปลอดภัยไซเบอร์': ['Firewall', 'SIEM', 'Cloud Security'],
};

const PRIVATE_CANDIDATES = new Set(['paweena.s@example.com', 'pimjai.o@example.com']);

function expectedSalary(years: number): string {
  if (years >= 6) return 'มากกว่า 50,000 บาท';
  if (years >= 4) return '40,001 - 50,000 บาท';
  if (years >= 2) return '30,001 - 40,000 บาท';
  return '20,001 - 30,000 บาท';
}

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
        expectedSalary: expectedSalary(row.years),
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
        specialty1: SKILLS_BY_POSITION[row.position]?.[0] ?? 'Microsoft Office',
        specialty2: SKILLS_BY_POSITION[row.position]?.[1] ?? '',
        specialty3: SKILLS_BY_POSITION[row.position]?.[2] ?? '',
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
      privacy: PRIVATE_CANDIDATES.has(row.email) ? 'private' : 'public',
      sections,
    };
  });
}


/* ------------------------------------------------------------------ */
/* บริษัทตัวอย่างของผู้ประกอบการ (หลังบ้าน Owner)                      */
/* สร้างครั้งเดียว – รอบถัดไปไม่ทับข้อมูลที่ผู้ประกอบการแก้ไขเอง         */
/* ------------------------------------------------------------------ */

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

type SeedQuestion = {
  type: 'SINGLE' | 'DATE' | 'SHORT' | 'MULTI' | 'LONG';
  text: string;
  options?: string[];
  required?: boolean;
};

type SeedJob = {
  key: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  category: string;
  department: string;
  workStyle: 'ONSITE' | 'HYBRID' | 'REMOTE';
  employmentType: 'FULLTIME' | 'CONTRACT' | 'TEMPORARY';
  experienceYears: number;
  experienceLevel: 'NONE' | 'ONE_TWO' | 'THREE_FIVE' | 'SIX_TEN' | 'TEN_PLUS';
  salaryMin: number;
  salaryMax: number;
  openings: number;
  postedDaysAgo: number;
  description: string;
  skills: string[];
  benefits: string[];
  questions: SeedQuestion[];
};

const OWNER_JOBS: SeedJob[] = [
  {
    key: 'devops', title: 'DevOps Engineer', status: 'PUBLISHED', category: 'เทคโนโลยีสารสนเทศ',
    department: 'วิศวกรรม', workStyle: 'HYBRID', employmentType: 'FULLTIME', experienceYears: 3,
    experienceLevel: 'THREE_FIVE', salaryMin: 45000, salaryMax: 70000, openings: 2, postedDaysAgo: 14,
    description: 'ดูแลระบบ CI/CD และโครงสร้างพื้นฐานบนคลาวด์ ออกแบบระบบให้พร้อมใช้งานตลอดเวลา และทำงานร่วมกับทีมพัฒนาเพื่อส่งมอบซอฟต์แวร์ได้รวดเร็วและปลอดภัย',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'], benefits: ['ประกันสุขภาพ', 'ทำงานไฮบริด'],
    questions: [
      { type: 'SINGLE', text: 'คุณเคยดูแลระบบบน Kubernetes ใน production หรือไม่?', options: ['เคย', 'ไม่เคย'] },
      { type: 'MULTI', text: 'Cloud ที่คุณถนัด (เลือกได้หลายข้อ)', options: ['AWS', 'Google Cloud', 'Azure'] },
      { type: 'DATE', text: 'คุณสามารถเริ่มงานได้วันไหน?' },
      { type: 'LONG', text: 'เล่าประสบการณ์แก้ปัญหาระบบล่มที่ภูมิใจที่สุด', required: false },
    ],
  },
  {
    key: 'backend', title: 'Backend Developer (Node.js)', status: 'PUBLISHED', category: 'เทคโนโลยีสารสนเทศ',
    department: 'วิศวกรรม', workStyle: 'ONSITE', employmentType: 'FULLTIME', experienceYears: 2,
    experienceLevel: 'ONE_TWO', salaryMin: 35000, salaryMax: 55000, openings: 3, postedDaysAgo: 10,
    description: 'พัฒนา REST API ด้วย NestJS และ PostgreSQL ออกแบบฐานข้อมูล เขียนเทสต์ และดูแลประสิทธิภาพของระบบหลังบ้าน',
    skills: ['Node.js', 'NestJS', 'PostgreSQL'], benefits: ['โบนัสประจำปี', 'งบอบรม'],
    questions: [
      { type: 'SHORT', text: 'เงินเดือนที่คาดหวัง (บาท)' },
      { type: 'SINGLE', text: 'ORM ที่คุณถนัดที่สุด', options: ['Prisma', 'TypeORM', 'Sequelize'] },
    ],
  },
  {
    key: 'security', title: 'Cyber Security Analyst', status: 'PUBLISHED', category: 'เทคโนโลยีสารสนเทศ',
    department: 'ความปลอดภัยสารสนเทศ', workStyle: 'ONSITE', employmentType: 'FULLTIME', experienceYears: 3,
    experienceLevel: 'THREE_FIVE', salaryMin: 40000, salaryMax: 65000, openings: 1, postedDaysAgo: 7,
    description: 'เฝ้าระวังและวิเคราะห์เหตุการณ์ด้านความปลอดภัยผ่าน SIEM ทดสอบเจาะระบบ และจัดทำรายงานพร้อมแนวทางแก้ไข',
    skills: ['SIEM', 'Penetration Testing', 'Network Security'], benefits: ['ประกันสุขภาพ', 'สอบใบรับรองฟรี'],
    questions: [
      { type: 'SINGLE', text: 'คุณมีใบรับรองด้านความปลอดภัยไซเบอร์หรือไม่?', options: ['มี', 'ไม่มี'] },
      { type: 'SHORT', text: 'ชื่อใบรับรองที่มี (ถ้ามี)', required: false },
    ],
  },
  {
    key: 'frontend', title: 'Frontend Developer (React)', status: 'DRAFT', category: 'เทคโนโลยีสารสนเทศ',
    department: 'ออกแบบผลิตภัณฑ์', workStyle: 'REMOTE', employmentType: 'CONTRACT', experienceYears: 1,
    experienceLevel: 'ONE_TWO', salaryMin: 30000, salaryMax: 50000, openings: 1, postedDaysAgo: 2,
    description: 'พัฒนาหน้าเว็บด้วย React และ Next.js ร่วมกับทีมออกแบบ ดูแลให้ใช้งานได้ดีทุกขนาดหน้าจอ',
    skills: ['React', 'TypeScript', 'Next.js'], benefits: ['ทำงานจากที่ไหนก็ได้'],
    questions: [],
  },
  {
    key: 'support', title: 'IT Support', status: 'CLOSED', category: 'เทคโนโลยีสารสนเทศ',
    department: 'ไอที', workStyle: 'ONSITE', employmentType: 'TEMPORARY', experienceYears: 0,
    experienceLevel: 'NONE', salaryMin: 18000, salaryMax: 25000, openings: 1, postedDaysAgo: 40,
    description: 'ดูแลคอมพิวเตอร์และอุปกรณ์เครือข่ายภายในสำนักงาน ช่วยเหลือพนักงานเมื่อพบปัญหาการใช้งาน',
    skills: ['Troubleshooting', 'Windows', 'Networking'], benefits: ['อาหารกลางวัน'],
    questions: [],
  },
];

/** ผู้สมัครที่สมัครเข้ามาในประกาศของบริษัทตัวอย่าง พร้อมคำตอบ (ตามลำดับคำถาม) */
const OWNER_APPLICATIONS: Array<{ email: string; job: string; daysAgo: number; answers: Array<string | string[] | null> }> = [
  { email: 'anucha.m@example.com', job: 'devops', daysAgo: 1, answers: ['เคย', ['AWS', 'Google Cloud'], '2026-10-01', 'เคยย้ายระบบจาก VM ขึ้น Kubernetes ตอนระบบล่มกลางคืน แก้ไขภายใน 40 นาทีและเขียน runbook ให้ทีม'] },
  { email: 'pakpoom.s@example.com', job: 'devops', daysAgo: 6, answers: ['ไม่เคย', ['AWS'], '2026-11-01', null] },
  { email: 'somchai.j@example.com', job: 'backend', daysAgo: 0, answers: ['45,000', 'Prisma'] },
  { email: 'manat.w@example.com', job: 'backend', daysAgo: 2, answers: ['38,000', 'TypeORM'] },
  { email: 'paweena.s@example.com', job: 'backend', daysAgo: 5, answers: ['32,000', 'Prisma'] },
  { email: 'kittaya.p@example.com', job: 'security', daysAgo: 3, answers: ['มี', 'CompTIA Security+'] },
  { email: 'wichai.t@example.com', job: 'security', daysAgo: 8, answers: ['มี', 'CEH, ISO 27001 Lead Auditor'] },
  { email: 'pimjai.o@example.com', job: 'support', daysAgo: 20, answers: [] },
];

async function seedOwnerDemo() {
  const owner = await prisma.user.findUnique({ where: { email: 'owner@cyberjob.co.th' } });
  if (!owner) return;

  const existing = await prisma.company.findUnique({ where: { ownerId: owner.id } });
  if (existing) {
    console.log('  บริษัทของผู้ประกอบการทดสอบ: มีอยู่แล้ว (ไม่ทับข้อมูลเดิม)');
    return;
  }

  const company = await prisma.company.create({
    data: {
      slug: 'cybertech-solutions',
      name: 'CyberTech Solutions',
      legalName: 'บริษัท ไซเบอร์เทค โซลูชั่นส์ จำกัด',
      logoText: 'CT',
      logoColor: '#1E3A8A',
      verified: true,
      businessType: 'เทคโนโลยีสารสนเทศ',
      employeeCount: '51–200 คน',
      about: 'CyberTech Solutions ให้บริการที่ปรึกษาและพัฒนาระบบด้านความปลอดภัยไซเบอร์และคลาวด์ให้องค์กรชั้นนำทั่วประเทศ',
      email: 'hr@cybertech.co.th',
      phone: '02-123-4567',
      website: 'https://www.cybertech.co.th',
      address: '99/9 อาคารไซเบอร์ทาวเวอร์ ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง',
      province: 'กรุงเทพมหานคร',
      district: 'ห้วยขวาง',
      ownerId: owner.id,
      companyType: 'PRIVATE',
      registrationNumber: '0105561234567',
      contactName: 'สมศรี ใจงาม',
      contactPosition: 'HR Manager',
      contactPhone: '081-234-5678',
      mapUrl: 'https://maps.google.com/?q=13.7563,100.5018',
      lat: 13.7563,
      lng: 100.5018,
      verificationStatus: 'APPROVED',
      verificationSubmittedAt: daysAgo(30),
      plan: 'GOLD',
      planExpiresAt: new Date(Date.now() + 365 * DAY),
    },
  });

  const jobIds: Record<string, string> = {};
  const questionIds: Record<string, string[]> = {};
  for (const job of OWNER_JOBS) {
    const row = await prisma.job.create({
      data: {
        slug: `cybertech-${job.key}`,
        title: job.title,
        companyId: company.id,
        category: job.category,
        province: company.province,
        district: company.district,
        workStyle: job.workStyle,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        experienceYears: job.experienceYears,
        department: job.department,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        postedAt: daysAgo(job.postedDaysAgo),
        status: job.status,
        isActive: job.status === 'PUBLISHED',
        summary: job.description.slice(0, 160),
        description: job.description,
        skills: job.skills,
        benefits: job.benefits,
        openings: job.openings,
        questions: {
          create: job.questions.map((question, index) => ({
            position: index,
            type: question.type,
            text: question.text,
            options: question.options ?? [],
            required: question.required ?? true,
          })),
        },
      },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    jobIds[job.key] = row.id;
    questionIds[job.key] = row.questions.map((question) => question.id);
  }

  const users = await prisma.user.findMany({
    where: { email: { in: OWNER_APPLICATIONS.map((item) => item.email).concat(['somying.r@example.com', 'teerapong.j@example.com', 'supawadee.k@example.com']) } },
    select: { id: true, email: true },
  });
  const idOf = (email: string) => users.find((user) => user.email === email)?.id;

  for (const application of OWNER_APPLICATIONS) {
    const userId = idOf(application.email);
    if (!userId) continue;
    const job = OWNER_JOBS.find((item) => item.key === application.job)!;
    const createdAt = daysAgo(application.daysAgo);
    await prisma.application.create({
      data: {
        userId,
        jobId: jobIds[application.job],
        createdAt,
        answers: {
          create: job.questions.flatMap((question, index) => {
            const answer = application.answers[index];
            if (answer === null || answer === undefined) return [];
            return [{
              questionId: questionIds[application.job][index],
              questionText: question.text,
              questionType: question.type,
              answer,
              position: index,
              createdAt,
            }];
          }),
        },
      },
    });
  }

  for (const email of ['somying.r@example.com', 'teerapong.j@example.com', 'anucha.m@example.com']) {
    const candidateId = idOf(email);
    if (candidateId) {
      await prisma.candidateBookmark.create({ data: { companyId: company.id, candidateId } });
    }
  }

  const invitations: Array<{ email: string; job: string; status: 'SENT' | 'ACCEPTED' | 'DECLINED'; daysAgo: number }> = [
    { email: 'somying.r@example.com', job: 'backend', status: 'SENT', daysAgo: 1 },
    { email: 'teerapong.j@example.com', job: 'devops', status: 'DECLINED', daysAgo: 4 },
    { email: 'supawadee.k@example.com', job: 'backend', status: 'ACCEPTED', daysAgo: 6 },
    { email: 'wichai.t@example.com', job: 'devops', status: 'SENT', daysAgo: 2 },
  ];
  for (const invitation of invitations) {
    const candidateId = idOf(invitation.email);
    if (!candidateId) continue;
    await prisma.invitation.create({
      data: {
        companyId: company.id,
        candidateId,
        jobId: jobIds[invitation.job],
        status: invitation.status,
        message: 'บริษัทสนใจประวัติของคุณและอยากเชิญให้สมัครตำแหน่งนี้',
        createdAt: daysAgo(invitation.daysAgo),
        respondedAt: invitation.status === 'SENT' ? null : daysAgo(Math.max(invitation.daysAgo - 1, 0)),
      },
    });
  }

  console.log(`  บริษัทของผู้ประกอบการทดสอบ: ${OWNER_JOBS.length} ประกาศ, ${OWNER_APPLICATIONS.length} ใบสมัคร`);
}
