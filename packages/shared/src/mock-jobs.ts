import type {
  Company,
  EmploymentType,
  ExperienceLevel,
  Job,
  WorkStyle,
} from './types';

/* ------------------------------------------------------------------ */
/* บริษัท                                                              */
/* ------------------------------------------------------------------ */

const COMPANIES: Record<string, Company> = {
  techinnov: {
    id: 'c-techinnov',
    slug: 'tech-innovators',
    name: 'บริษัท เทค อินโนเวเตอร์ส จำกัด',
    legalName: 'Tech Innovators Co., Ltd',
    logoText: 'T',
    logoColor: '#FFC629',
    verified: true,
    businessType: 'Information Technology Services',
    employeeCount: '201-500 คน',
    about:
      'Tech Innovators Co., Ltd เป็นบริษัทชั้นนำด้านเทคโนโลยีและนวัตกรรม ด้วยวิสัยทัศน์ที่มุ่งมั่นในการพัฒนาและสร้างสรรค์ผลิตภัณฑ์ที่ทันสมัยและมีคุณภาพสูง บริษัทของเราก่อตั้งขึ้นในปี พ.ศ. 2550 โดยทีมงานผู้เชี่ยวชาญที่มีประสบการณ์และความรู้ความชำนาญในด้านเทคโนโลยีสารสนเทศและการสื่อสาร',
    contact: {
      email: 'hr@techinnovators.co.th',
      phone: '02-123-4567',
      website: 'www.techinnovators.co.th',
      address:
        '1234 ถนนเทคโนโลยี แขวงนวัตกรรม เขตพัฒนาการ กรุงเทพฯ 10110',
    },
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    location: { lat: 13.7699, lng: 100.5749 },
  },
  datagrowth: {
    id: 'c-datagrowth',
    slug: 'data-growth-agency',
    name: 'บริษัท ดาต้า โกรท เอเจนซี่ จำกัด',
    legalName: 'Data Growth Agency Co., Ltd',
    logoText: 'D',
    logoColor: '#22C55E',
    verified: true,
    businessType: 'Digital Marketing Agency',
    employeeCount: '51-200 คน',
    about:
      'เอเจนซี่การตลาดที่ขับเคลื่อนด้วยข้อมูลและ Performance Marketing ดูแลลูกค้าตั้งแต่แบรนด์ท้องถิ่นจนถึงองค์กรข้ามชาติ เรามุ่งเน้นผลลัพธ์ที่วัดผลได้จริงในทุกแคมเปญ',
    contact: {
      email: 'careers@datagrowth.co.th',
      phone: '02-234-5678',
      website: 'www.datagrowth.co.th',
      address: '55 อาคารเอเชีย ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110',
    },
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    location: { lat: 13.7378, lng: 100.5602 },
  },
  userfirst: {
    id: 'c-userfirst',
    slug: 'userfirst-studio',
    name: 'บริษัท ยูสเซอร์เฟิร์สท สตูดิโอ จำกัด',
    legalName: 'UserFirst Studio Co., Ltd',
    logoText: 'U',
    logoColor: '#8B5CF6',
    verified: true,
    businessType: 'Design & Creative Services',
    employeeCount: '11-50 คน',
    about:
      'สตูดิโอออกแบบ UX/UI ที่ทำงานร่วมกับสตาร์ทอัพและองค์กรทั่วเอเชีย เราเชื่อว่าการออกแบบที่ดีเริ่มจากการเข้าใจผู้ใช้อย่างแท้จริง',
    contact: {
      email: 'hello@userfirst.studio',
      phone: '02-345-6789',
      website: 'www.userfirst.studio',
      address: '19 ซอยสุขุมวิท 26 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
    },
    province: 'กรุงเทพมหานคร',
    district: 'คลองเตย',
    location: { lat: 13.7226, lng: 100.5697 },
  },
  siamcloud: {
    id: 'c-siamcloud',
    slug: 'siam-cloud-systems',
    name: 'บริษัท สยาม คลาวด์ ซิสเต็มส์ จำกัด',
    legalName: 'Siam Cloud Systems Co., Ltd',
    logoText: 'S',
    logoColor: '#0EA5E9',
    verified: true,
    businessType: 'Cloud & Infrastructure Services',
    employeeCount: '201-500 คน',
    about:
      'ผู้ให้บริการโครงสร้างพื้นฐานคลาวด์และ Managed Service สำหรับองค์กรในประเทศไทย ดูแลระบบที่รองรับผู้ใช้งานหลายล้านรายต่อวัน',
    contact: {
      email: 'jobs@siamcloud.co.th',
      phone: '02-456-7890',
      website: 'www.siamcloud.co.th',
      address: '999 อาคารเซ็นทรัลทาวเวอร์ ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    },
    province: 'กรุงเทพมหานคร',
    district: 'จตุจักร',
    location: { lat: 13.8047, lng: 100.5537 },
  },
  nextfin: {
    id: 'c-nextfin',
    slug: 'nextfin-capital',
    name: 'บริษัท เน็กซ์ฟิน แคปปิตอล จำกัด',
    legalName: 'NextFin Capital Co., Ltd',
    logoText: 'N',
    logoColor: '#1B45B8',
    verified: true,
    businessType: 'Financial Technology',
    employeeCount: '501-1000 คน',
    about:
      'ฟินเทคด้านสินเชื่อดิจิทัลและระบบชำระเงิน ให้บริการลูกค้ารายย่อยและธุรกิจ SME ทั่วประเทศ',
    contact: {
      email: 'recruit@nextfin.co.th',
      phone: '02-567-8901',
      website: 'www.nextfin.co.th',
      address: '888 อาคารการเงิน ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    },
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    location: { lat: 13.7248, lng: 100.5286 },
  },
  bluewhale: {
    id: 'c-bluewhale',
    slug: 'blue-whale-logistics',
    name: 'บริษัท บลูเวล โลจิสติกส์ จำกัด',
    legalName: 'Blue Whale Logistics Co., Ltd',
    logoText: 'B',
    logoColor: '#0F2A6B',
    verified: false,
    businessType: 'Transport & Logistics',
    employeeCount: '1000+ คน',
    about:
      'ผู้ให้บริการขนส่งและคลังสินค้าครบวงจร มีเครือข่ายศูนย์กระจายสินค้าครอบคลุมทุกภูมิภาค',
    contact: {
      email: 'hr@bluewhale.co.th',
      phone: '02-678-9012',
      website: 'www.bluewhale-logistics.co.th',
      address: '77 นิคมอุตสาหกรรมบางปู ตำบลบางปูใหม่ อำเภอเมือง สมุทรปราการ 10280',
    },
    province: 'สมุทรปราการ',
    location: { lat: 13.5407, lng: 100.6413 },
  },
  greenleaf: {
    id: 'c-greenleaf',
    slug: 'green-leaf-manufacturing',
    name: 'บริษัท กรีนลีฟ แมนูแฟคเจอริ่ง จำกัด',
    legalName: 'Green Leaf Manufacturing Co., Ltd',
    logoText: 'G',
    logoColor: '#16A34A',
    verified: true,
    businessType: 'Electronics Manufacturing',
    employeeCount: '1000+ คน',
    about:
      'โรงงานผลิตชิ้นส่วนอิเล็กทรอนิกส์มาตรฐานสากล ได้รับการรับรอง ISO 9001 และ ISO 14001',
    contact: {
      email: 'people@greenleaf.co.th',
      phone: '038-123-456',
      website: 'www.greenleaf-mfg.co.th',
      address: '111 นิคมอุตสาหกรรมมาบตาพุด ตำบลมาบตาพุด อำเภอเมือง ระยอง 21150',
    },
    province: 'ระยอง',
    location: { lat: 12.6807, lng: 101.2537 },
  },
  carecentral: {
    id: 'c-carecentral',
    slug: 'care-central-hospital',
    name: 'โรงพยาบาลแคร์เซ็นทรัล',
    legalName: 'Care Central Hospital Co., Ltd',
    logoText: 'C',
    logoColor: '#EF4444',
    verified: true,
    businessType: 'Healthcare & Hospital',
    employeeCount: '501-1000 คน',
    about:
      'โรงพยาบาลเอกชนที่ให้บริการครบวงจร มีศูนย์เฉพาะทางกว่า 20 ศูนย์ พร้อมทีมแพทย์ผู้เชี่ยวชาญ',
    contact: {
      email: 'hrd@carecentral.co.th',
      phone: '043-234-567',
      website: 'www.carecentral.co.th',
      address: '456 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมือง ขอนแก่น 40000',
    },
    province: 'ขอนแก่น',
    location: { lat: 16.4322, lng: 102.8236 },
  },
  orangeretail: {
    id: 'c-orangeretail',
    slug: 'orange-retail-group',
    name: 'บริษัท ออเรนจ์ รีเทล กรุ๊ป จำกัด',
    legalName: 'Orange Retail Group Co., Ltd',
    logoText: 'O',
    logoColor: '#F97316',
    verified: false,
    businessType: 'Retail & E-commerce',
    employeeCount: '1000+ คน',
    about:
      'เครือข่ายร้านค้าปลีกและอีคอมเมิร์ซที่มีสาขากว่า 400 แห่งทั่วประเทศ',
    contact: {
      email: 'talent@orangeretail.co.th',
      phone: '02-789-0123',
      website: 'www.orangeretail.co.th',
      address: '222 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    },
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    location: { lat: 13.7699, lng: 100.5749 },
  },
  mindpeak: {
    id: 'c-mindpeak',
    slug: 'mindpeak-consulting',
    name: 'บริษัท มายด์พีค คอนซัลติ้ง จำกัด',
    legalName: 'MindPeak Consulting Co., Ltd',
    logoText: 'M',
    logoColor: '#7C3AED',
    verified: true,
    businessType: 'Management Consulting',
    employeeCount: '51-200 คน',
    about:
      'บริษัทที่ปรึกษาด้านกลยุทธ์และการเปลี่ยนผ่านดิจิทัล ให้บริการองค์กรขนาดใหญ่ในภูมิภาคอาเซียน',
    contact: {
      email: 'join@mindpeak.co.th',
      phone: '02-890-1234',
      website: 'www.mindpeak.co.th',
      address: '33 อาคารสาทรสแควร์ ถนนสาทรเหนือ แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    },
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    location: { lat: 13.7236, lng: 100.5289 },
  },
};

/* ------------------------------------------------------------------ */
/* Seed – ข้อมูลเฉพาะของแต่ละประกาศ                                     */
/* ------------------------------------------------------------------ */

interface Seed {
  title: string;
  company: keyof typeof COMPANIES;
  category: string;
  sub: string;
  province: string;
  district?: string;
  workStyle: WorkStyle;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  daysAgo: number;
  isUrgent?: boolean;
  skills: string[];
  summary: string;
  openings?: number;
  negotiable?: boolean;
}

const IT = 'เทคโนโลยีสารสนเทศ';
const DESIGN = 'ศิลปะ สื่อ และการออกแบบ';
const MARKETING = 'การตลาดและประชาสัมพันธ์';
const SALES = 'การขาย';
const FINANCE = 'การเงินและบัญชี';
const HR = 'ทรัพยากรบุคคล';
const MFG = 'การผลิต';
const LOGISTICS = 'ขนส่งและโลจิสติกส์';
const CS = 'บริการลูกค้า';
const HEALTH = 'สุขภาพและการแพทย์';
const PARTTIME = 'Part-time/พนักงานสัญญาจ้าง/นักศึกษาฝึกงาน';

const SEEDS: Seed[] = [
  {
    title: 'Frontend Developer',
    company: 'techinnov',
    category: IT,
    sub: 'พัฒนาซอฟต์แวร์',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 35000,
    salaryMax: 50000,
    daysAgo: 0,
    isUrgent: true,
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST API'],
    summary:
      'พัฒนาและดูแลหน้าเว็บแอปพลิเคชันขององค์กร ร่วมทำงานกับทีมดีไซน์และ Backend เพื่อส่งมอบฟีเจอร์ใหม่ทุกสองสัปดาห์',
    openings: 2,
  },
  {
    title: 'Digital Marketing Specialist',
    company: 'datagrowth',
    category: MARKETING,
    sub: 'การตลาดดิจิทัล',
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '3-5',
    salaryMin: 25000,
    salaryMax: 40000,
    daysAgo: 1,
    skills: ['Google Ads', 'Meta Ads', 'SEO', 'Google Analytics 4', 'Data Studio'],
    summary:
      'วางแผนและบริหารแคมเปญโฆษณาออนไลน์ให้ลูกค้าหลากหลายอุตสาหกรรม พร้อมรายงานผลและปรับกลยุทธ์รายสัปดาห์',
  },
  {
    title: 'UX/UI Designer',
    company: 'userfirst',
    category: DESIGN,
    sub: 'UX/UI',
    province: 'กรุงเทพมหานคร',
    district: 'คลองเตย',
    workStyle: 'remote',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 20000,
    salaryMax: 30000,
    daysAgo: 2,
    skills: ['Figma', 'Design System', 'User Research', 'Prototyping'],
    summary:
      'ออกแบบประสบการณ์ผู้ใช้ตั้งแต่ Wireframe จนถึง Prototype พร้อมดูแล Design System ของผลิตภัณฑ์',
  },
  {
    title: 'Backend Developer (Node.js)',
    company: 'siamcloud',
    category: IT,
    sub: 'พัฒนาซอฟต์แวร์',
    province: 'กรุงเทพมหานคร',
    district: 'จตุจักร',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '3-5',
    salaryMin: 55000,
    salaryMax: 85000,
    daysAgo: 3,
    isUrgent: true,
    skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Docker', 'AWS'],
    summary:
      'ออกแบบและพัฒนา REST/GraphQL API ที่รองรับผู้ใช้งานหลักล้าน ดูแลประสิทธิภาพและความปลอดภัยของระบบ',
  },
  {
    title: 'ERP Developer (Microsoft Dynamics AX)',
    company: 'techinnov',
    category: IT,
    sub: 'พัฒนาซอฟต์แวร์',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 10000,
    salaryMax: 15000,
    daysAgo: 6,
    skills: ['Microsoft Dynamics AX', 'X++', 'SQL Server', 'ERP'],
    summary:
      'รับผิดชอบการพัฒนาและดูแลระบบ ERP Microsoft Dynamics AX ขององค์กร ออกแบบ พัฒนา และทดสอบฟังก์ชันใหม่ ตลอดจนปรับปรุงวิธีการระบบให้ทำงานได้อย่างมีประสิทธิภาพ',
  },
  {
    title: 'Data Analyst',
    company: 'nextfin',
    category: FINANCE,
    sub: 'วิเคราะห์ข้อมูลธุรกิจ',
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 30000,
    salaryMax: 45000,
    daysAgo: 4,
    skills: ['SQL', 'Python', 'Power BI', 'Excel'],
    summary:
      'วิเคราะห์ข้อมูลสินเชื่อและพฤติกรรมลูกค้า จัดทำ Dashboard สนับสนุนการตัดสินใจของผู้บริหาร',
  },
  {
    title: 'DevOps Engineer',
    company: 'siamcloud',
    category: IT,
    sub: 'ดูแลระบบและเครือข่าย',
    province: 'นนทบุรี',
    workStyle: 'remote',
    employmentType: 'fulltime',
    experienceLevel: '6-10',
    salaryMin: 90000,
    salaryMax: 140000,
    daysAgo: 5,
    skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS', 'Observability'],
    summary:
      'ดูแลโครงสร้างพื้นฐานบนคลาวด์ ออกแบบ CI/CD Pipeline และระบบ Monitoring ให้ทีมพัฒนากว่า 10 ทีม',
  },
  {
    title: 'เจ้าหน้าที่บัญชี',
    company: 'greenleaf',
    category: FINANCE,
    sub: 'บัญชี',
    province: 'สมุทรปราการ',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 18000,
    salaryMax: 25000,
    daysAgo: 6,
    skills: ['บัญชีต้นทุน', 'SAP', 'ภาษีอากร', 'Excel'],
    summary: 'จัดทำบัญชีต้นทุนการผลิต กระทบยอด และปิดงบรายเดือนให้ทันกำหนด',
    openings: 3,
  },
  {
    title: 'HR Recruiter',
    company: 'orangeretail',
    category: HR,
    sub: 'สรรหาบุคลากร',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 22000,
    salaryMax: 32000,
    daysAgo: 7,
    skills: ['Sourcing', 'Interview', 'HRIS', 'Employer Branding'],
    summary:
      'สรรหาบุคลากรสำหรับสาขาทั่วประเทศ ดูแลกระบวนการตั้งแต่คัดกรองใบสมัครถึงเสนอผลตอบแทน',
  },
  {
    title: 'Mobile Developer (Flutter)',
    company: 'techinnov',
    category: IT,
    sub: 'พัฒนาซอฟต์แวร์',
    province: 'เชียงใหม่',
    workStyle: 'remote',
    employmentType: 'contract',
    experienceLevel: '3-5',
    salaryMin: 60000,
    salaryMax: 90000,
    daysAgo: 8,
    skills: ['Flutter', 'Dart', 'Firebase', 'REST API'],
    summary:
      'พัฒนาแอปพลิเคชันมือถือข้ามแพลตฟอร์ม สัญญาจ้าง 12 เดือน ต่อสัญญาได้ตามผลงาน',
  },
  {
    title: 'Graphic Designer',
    company: 'datagrowth',
    category: DESIGN,
    sub: 'กราฟิกดีไซน์',
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '0',
    salaryMin: 18000,
    salaryMax: 24000,
    daysAgo: 9,
    skills: ['Photoshop', 'Illustrator', 'Canva', 'Motion Graphic'],
    summary:
      'ออกแบบสื่อโฆษณาออนไลน์ ทั้งภาพนิ่งและวิดีโอสั้น สำหรับแคมเปญของลูกค้า',
  },
  {
    title: 'Sales Executive',
    company: 'nextfin',
    category: SALES,
    sub: 'ขายในประเทศ',
    province: 'ชลบุรี',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 20000,
    salaryMax: 35000,
    daysAgo: 10,
    isUrgent: true,
    skills: ['B2B Sales', 'CRM', 'Negotiation'],
    summary:
      'นำเสนอผลิตภัณฑ์สินเชื่อให้ลูกค้าธุรกิจในเขตภาคตะวันออก พร้อมค่าคอมมิชชั่นไม่จำกัด',
    openings: 5,
  },
  {
    title: 'QA Engineer',
    company: 'techinnov',
    category: IT,
    sub: 'ทดสอบคุณภาพซอฟต์แวร์',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 32000,
    salaryMax: 48000,
    daysAgo: 11,
    skills: ['Test Automation', 'Playwright', 'Postman', 'Agile'],
    summary:
      'วางแผนและทดสอบคุณภาพซอฟต์แวร์ พร้อมพัฒนา Automated Test ให้ครอบคลุม Regression',
  },
  {
    title: 'วิศวกรกระบวนการผลิต',
    company: 'greenleaf',
    category: MFG,
    sub: 'วิศวกรรมการผลิต',
    province: 'ระยอง',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '3-5',
    salaryMin: 35000,
    salaryMax: 55000,
    daysAgo: 12,
    skills: ['Lean Manufacturing', 'Six Sigma', 'AutoCAD', 'ISO 9001'],
    summary:
      'ปรับปรุงกระบวนการผลิตให้มีประสิทธิภาพ ลดของเสีย และควบคุมคุณภาพตามมาตรฐานสากล',
  },
  {
    title: 'เจ้าหน้าที่คลังสินค้า',
    company: 'bluewhale',
    category: LOGISTICS,
    sub: 'คลังสินค้า',
    province: 'พระนครศรีอยุธยา',
    workStyle: 'onsite',
    employmentType: 'temporary',
    experienceLevel: '0',
    salaryMin: 13000,
    salaryMax: 16000,
    daysAgo: 13,
    skills: ['WMS', 'Forklift', 'Stock Count'],
    summary:
      'ปฏิบัติงานรับ-จ่ายสินค้าและตรวจนับสต๊อกในคลัง งานชั่วคราว 6 เดือน มีโอกาสบรรจุ',
    openings: 10,
  },
  {
    title: 'Customer Support Officer',
    company: 'orangeretail',
    category: CS,
    sub: 'คอลเซ็นเตอร์',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'remote',
    employmentType: 'parttime',
    experienceLevel: '0',
    salaryMin: 12000,
    salaryMax: 18000,
    daysAgo: 14,
    skills: ['Live Chat', 'CRM', 'การสื่อสาร'],
    summary: 'ดูแลลูกค้าผ่านแชทและโทรศัพท์ ทำงานเป็นกะ เลือกเวลาได้ยืดหยุ่น',
    openings: 8,
  },
  {
    title: 'พยาบาลวิชาชีพ',
    company: 'carecentral',
    category: HEALTH,
    sub: 'พยาบาล',
    province: 'ขอนแก่น',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '1-2',
    salaryMin: 28000,
    salaryMax: 42000,
    daysAgo: 15,
    isUrgent: true,
    skills: ['การพยาบาลผู้ป่วยใน', 'BLS', 'ACLS'],
    summary:
      'ดูแลผู้ป่วยในหอผู้ป่วยตามมาตรฐานวิชาชีพ มีค่าเวรและสวัสดิการที่พัก',
    openings: 4,
  },
  {
    title: 'Business Analyst',
    company: 'mindpeak',
    category: FINANCE,
    sub: 'วิเคราะห์ข้อมูลธุรกิจ',
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '3-5',
    salaryMin: 45000,
    salaryMax: 70000,
    daysAgo: 16,
    skills: ['Requirement Gathering', 'BPMN', 'SQL', 'Stakeholder Management'],
    summary:
      'เก็บและวิเคราะห์ความต้องการทางธุรกิจ แปลงเป็นเอกสารสำหรับทีมพัฒนา และติดตามผลลัพธ์',
  },
  {
    title: 'Content Writer',
    company: 'datagrowth',
    category: MARKETING,
    sub: 'แบรนด์และคอนเทนต์',
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    workStyle: 'remote',
    employmentType: 'contract',
    experienceLevel: '1-2',
    salaryMin: 20000,
    salaryMax: 30000,
    daysAgo: 17,
    skills: ['SEO Writing', 'Copywriting', 'WordPress'],
    summary:
      'เขียนบทความและคอนเทนต์โซเชียลตามแผนคอนเทนต์รายเดือน สัญญาจ้างรายปี',
  },
  {
    title: 'Product Manager',
    company: 'techinnov',
    category: IT,
    sub: 'บริหารผลิตภัณฑ์',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '6-10',
    salaryMin: 90000,
    salaryMax: 130000,
    daysAgo: 18,
    skills: ['Product Discovery', 'Roadmap', 'Agile', 'Data-driven'],
    summary:
      'กำหนดวิสัยทัศน์และโรดแมปของผลิตภัณฑ์ ทำงานร่วมกับทีมวิศวกรรมและดีไซน์ตลอดวงจรการพัฒนา',
  },
  {
    title: 'Cyber Security Specialist',
    company: 'siamcloud',
    category: IT,
    sub: 'ความปลอดภัยไซเบอร์',
    province: 'กรุงเทพมหานคร',
    district: 'จตุจักร',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '6-10',
    salaryMin: 100000,
    salaryMax: 160000,
    daysAgo: 19,
    skills: ['SIEM', 'Penetration Testing', 'ISO 27001', 'Incident Response'],
    summary:
      'ดูแลความมั่นคงปลอดภัยของระบบ ตรวจสอบช่องโหว่ และรับมือเหตุการณ์ภัยคุกคาม',
  },
  {
    title: 'ผู้จัดการฝ่ายขาย',
    company: 'orangeretail',
    category: SALES,
    sub: 'พัฒนาธุรกิจ',
    province: 'นครราชสีมา',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '10+',
    salaryMin: 80000,
    salaryMax: 120000,
    daysAgo: 20,
    skills: ['Team Leadership', 'Sales Strategy', 'P&L'],
    summary:
      'บริหารทีมขายภาคอีสาน ตั้งเป้าหมายและพัฒนาศักยภาพทีมให้บรรลุยอดขาย',
  },
  {
    title: 'IT Support',
    company: 'carecentral',
    category: IT,
    sub: 'สนับสนุนด้านไอที',
    province: 'ขอนแก่น',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '0',
    salaryMin: 16000,
    salaryMax: 22000,
    daysAgo: 21,
    skills: ['Windows', 'Network', 'Helpdesk', 'Hardware'],
    summary:
      'ดูแลอุปกรณ์คอมพิวเตอร์และระบบเครือข่ายภายในโรงพยาบาล ให้บริการผู้ใช้งาน',
  },
  {
    title: 'Motion Graphic Designer',
    company: 'userfirst',
    category: DESIGN,
    sub: 'มัลติมีเดียและวิดีโอ',
    province: 'ภูเก็ต',
    workStyle: 'remote',
    employmentType: 'contract',
    experienceLevel: '1-2',
    salaryMin: 25000,
    salaryMax: 40000,
    daysAgo: 22,
    skills: ['After Effects', 'Premiere Pro', 'Storyboard'],
    summary:
      'ผลิตวิดีโอโมชั่นกราฟิกสำหรับแคมเปญและสื่อภายในองค์กร ทำงานทางไกลได้เต็มรูปแบบ',
  },
  {
    title: 'นักศึกษาฝึกงาน – Software Engineer',
    company: 'techinnov',
    category: PARTTIME,
    sub: 'นักศึกษาฝึกงาน',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    workStyle: 'hybrid',
    employmentType: 'internship',
    experienceLevel: '0',
    salaryMin: 0,
    salaryMax: 0,
    daysAgo: 23,
    negotiable: true,
    skills: ['JavaScript', 'Git', 'ความกระตือรือร้น'],
    summary:
      'ฝึกงานกับทีมพัฒนาจริง มีพี่เลี้ยงดูแลตลอดโครงการ ระยะเวลา 4 เดือน มีเบี้ยเลี้ยงรายวัน',
    openings: 6,
  },
  {
    title: 'Supply Chain Planner',
    company: 'bluewhale',
    category: LOGISTICS,
    sub: 'วางแผนอุปทาน',
    province: 'สมุทรปราการ',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '3-5',
    salaryMin: 40000,
    salaryMax: 60000,
    daysAgo: 25,
    skills: ['Demand Planning', 'SAP', 'Excel Advanced', 'S&OP'],
    summary:
      'วางแผนอุปทานและบริหารสต๊อกให้สอดคล้องกับความต้องการของลูกค้าทั่วประเทศ',
  },
  {
    title: 'เจ้าหน้าที่ธุรการ',
    company: 'greenleaf',
    category: HR,
    sub: 'ธุรการและงานเอกสาร',
    province: 'ปทุมธานี',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '0',
    salaryMin: 14000,
    salaryMax: 18000,
    daysAgo: 27,
    skills: ['Microsoft Office', 'งานเอกสาร', 'ประสานงาน'],
    summary:
      'ดูแลงานเอกสาร ประสานงานภายในองค์กร และสนับสนุนงานทั่วไปของฝ่ายบุคคล',
  },
  {
    title: 'Financial Controller',
    company: 'nextfin',
    category: FINANCE,
    sub: 'การเงิน',
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '10+',
    salaryMin: 120000,
    salaryMax: 180000,
    daysAgo: 29,
    skills: ['IFRS', 'Budgeting', 'Internal Control', 'Leadership'],
    summary:
      'ควบคุมงบการเงินของกลุ่มบริษัท วางระบบควบคุมภายใน และดูแลการตรวจสอบบัญชี',
  },
  {
    title: 'Call Center Supervisor',
    company: 'orangeretail',
    category: CS,
    sub: 'ลูกค้าสัมพันธ์',
    province: 'สงขลา',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '3-5',
    salaryMin: 30000,
    salaryMax: 42000,
    daysAgo: 32,
    skills: ['Team Management', 'KPI', 'Quality Assurance'],
    summary:
      'ดูแลทีมคอลเซ็นเตอร์ 20 คน ควบคุมคุณภาพการบริการและ KPI ประจำเดือน',
  },
  {
    title: 'Cloud Solution Architect',
    company: 'siamcloud',
    category: IT,
    sub: 'ดูแลระบบและเครือข่าย',
    province: 'กรุงเทพมหานคร',
    district: 'จตุจักร',
    workStyle: 'hybrid',
    employmentType: 'fulltime',
    experienceLevel: '10+',
    salaryMin: 150000,
    salaryMax: 200000,
    daysAgo: 36,
    skills: ['AWS', 'Azure', 'Solution Design', 'Presales'],
    summary:
      'ออกแบบสถาปัตยกรรมโซลูชันบนคลาวด์ให้ลูกค้าองค์กร และสนับสนุนทีมขายเชิงเทคนิค',
  },
  {
    title: 'Management Trainee',
    company: 'mindpeak',
    category: HR,
    sub: 'พัฒนาบุคลากร',
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    workStyle: 'onsite',
    employmentType: 'fulltime',
    experienceLevel: '0',
    salaryMin: 25000,
    salaryMax: 30000,
    daysAgo: 40,
    skills: ['Analytical Thinking', 'Presentation', 'English'],
    summary:
      'โครงการพัฒนาผู้บริหารรุ่นใหม่ หมุนเวียนงาน 4 แผนกภายใน 18 เดือน',
    openings: 12,
  },
];

/* ------------------------------------------------------------------ */
/* Template สำหรับเติมรายละเอียดงาน                                     */
/* ------------------------------------------------------------------ */

const REQUIREMENT_TEMPLATES: Record<string, string[]> = {
  [IT]: [
    'ออกแบบ พัฒนา และดูแลระบบให้มีคุณภาพและปลอดภัยตามมาตรฐานของทีม',
    'ร่วมประชุมวางแผน Sprint และประเมินขอบเขตงานร่วมกับ Product Owner',
    'เขียน Unit Test และร่วม Code Review เพื่อรักษาคุณภาพของโค้ด',
    'จัดทำเอกสารทางเทคนิคและถ่ายทอดความรู้ให้เพื่อนร่วมทีม',
  ],
  [DESIGN]: [
    'ออกแบบงานตามโจทย์ของลูกค้าและแบรนด์ไกด์ไลน์ขององค์กร',
    'นำเสนอแนวคิดการออกแบบและรับฟีดแบ็กเพื่อปรับปรุงผลงาน',
    'ทำงานร่วมกับทีมการตลาดและทีมพัฒนาเพื่อส่งมอบงานตามกำหนด',
    'ดูแลคลังไฟล์งานออกแบบให้เป็นระเบียบและนำกลับมาใช้ซ้ำได้',
  ],
  [MARKETING]: [
    'วางแผนและดำเนินแคมเปญการตลาดตามงบประมาณที่ได้รับ',
    'ติดตามและวิเคราะห์ผลลัพธ์ พร้อมนำเสนอรายงานต่อผู้บริหาร',
    'ทำงานร่วมกับทีมครีเอทีฟเพื่อผลิตสื่อที่ตรงกลุ่มเป้าหมาย',
    'ศึกษาคู่แข่งและแนวโน้มตลาดเพื่อปรับกลยุทธ์อย่างต่อเนื่อง',
  ],
  [SALES]: [
    'ค้นหาและติดต่อลูกค้าใหม่ พร้อมดูแลความสัมพันธ์กับลูกค้าเดิม',
    'นำเสนอสินค้าและบริการ พร้อมเจรจาเงื่อนไขทางการค้า',
    'จัดทำใบเสนอราคาและติดตามผลจนปิดการขาย',
    'รายงานความคืบหน้าและวิเคราะห์โอกาสทางธุรกิจให้ผู้บังคับบัญชา',
  ],
  [FINANCE]: [
    'จัดทำและตรวจสอบเอกสารทางบัญชีให้ถูกต้องตามมาตรฐาน',
    'กระทบยอดบัญชีและปิดงบตามรอบระยะเวลาที่กำหนด',
    'ประสานงานกับผู้สอบบัญชีและหน่วยงานราชการที่เกี่ยวข้อง',
    'วิเคราะห์ข้อมูลทางการเงินเพื่อสนับสนุนการตัดสินใจ',
  ],
  [HR]: [
    'ดูแลงานเอกสารและระบบจัดเก็บข้อมูลของฝ่าย',
    'ประสานงานระหว่างหน่วยงานภายในและภายนอกองค์กร',
    'สนับสนุนกิจกรรมและโครงการพัฒนาบุคลากร',
    'จัดทำรายงานประจำเดือนเสนอผู้บังคับบัญชา',
  ],
  [MFG]: [
    'ควบคุมและปรับปรุงกระบวนการผลิตให้ได้ตามเป้าหมาย',
    'วิเคราะห์ปัญหาหน้างานและกำหนดมาตรการแก้ไขป้องกัน',
    'ดูแลความปลอดภัยและมาตรฐานคุณภาพในสายการผลิต',
    'จัดทำรายงานผลการผลิตและตัวชี้วัดประจำสัปดาห์',
  ],
  [LOGISTICS]: [
    'บริหารการรับ-จ่ายสินค้าและความถูกต้องของสต๊อก',
    'วางแผนการจัดส่งให้ตรงเวลาและควบคุมต้นทุนขนส่ง',
    'ประสานงานกับซัพพลายเออร์และหน่วยงานที่เกี่ยวข้อง',
    'จัดทำรายงานสต๊อกและตัวชี้วัดด้านโลจิสติกส์',
  ],
  [CS]: [
    'ให้บริการและตอบข้อสงสัยของลูกค้าผ่านช่องทางที่รับผิดชอบ',
    'บันทึกข้อมูลการติดต่อและติดตามเรื่องจนปิดเคส',
    'ประสานงานกับหน่วยงานภายในเพื่อแก้ไขปัญหาให้ลูกค้า',
    'เสนอแนะแนวทางปรับปรุงบริการจากเสียงสะท้อนของลูกค้า',
  ],
  [HEALTH]: [
    'ให้การดูแลผู้ป่วยตามมาตรฐานวิชาชีพและแนวปฏิบัติของโรงพยาบาล',
    'บันทึกข้อมูลทางการแพทย์อย่างถูกต้องและครบถ้วน',
    'ประสานงานกับทีมสหวิชาชีพเพื่อวางแผนการดูแลผู้ป่วย',
    'ให้คำแนะนำด้านสุขภาพแก่ผู้ป่วยและญาติ',
  ],
  [PARTTIME]: [
    'เรียนรู้และปฏิบัติงานจริงร่วมกับทีมตามที่ได้รับมอบหมาย',
    'เข้าร่วมประชุมทีมและนำเสนอความคืบหน้าของงาน',
    'จัดทำสรุปผลการฝึกงานเมื่อจบโครงการ',
  ],
};

const GENERIC_REQUIREMENTS = [
  'ปฏิบัติงานตามที่ได้รับมอบหมายให้สำเร็จตามเป้าหมาย',
  'ทำงานร่วมกับทีมและหน่วยงานที่เกี่ยวข้องอย่างมีประสิทธิภาพ',
  'จัดทำรายงานผลการดำเนินงานเสนอผู้บังคับบัญชา',
];

const EXPERIENCE_TEXT: Record<ExperienceLevel, string> = {
  '0': 'ยินดีรับนักศึกษาจบใหม่ ไม่จำเป็นต้องมีประสบการณ์',
  '1-2': 'มีประสบการณ์ในสายงานที่เกี่ยวข้อง 1-2 ปี',
  '3-5': 'มีประสบการณ์ในสายงานที่เกี่ยวข้อง 3-5 ปี',
  '6-10': 'มีประสบการณ์ในสายงานที่เกี่ยวข้อง 6-10 ปี',
  '10+': 'มีประสบการณ์ในสายงานที่เกี่ยวข้อง 10 ปีขึ้นไป และเคยบริหารทีม',
};

const WORK_STYLE_TEXT: Record<WorkStyle, string> = {
  onsite: 'ปฏิบัติงานที่สำนักงาน',
  hybrid: 'ทำงานแบบไฮบริด เข้าออฟฟิศ 2-3 วันต่อสัปดาห์',
  remote: 'ทำงานทางไกลได้ 100% ประชุมออนไลน์ตามรอบ',
};

const EMPLOYER_ANSWERS = [
  'สิทธิ์ในการทำงานของคุณในประเทศไทยตรงกับตัวเลือกด้านล่างนี้หรือไม่',
  'ระดับเงินเดือนที่คาดหวังต่อเดือนคือเท่าไร',
  'คุณมีวุฒิการศึกษาระดับใด',
  'คุณมีประสบการณ์ในตำแหน่งลักษณะนี้กี่ปี',
  'คุณมีประสบการณ์ด้านงานที่เกี่ยวข้องหรือไม่',
  'คุณมีประสบการณ์ด้านงานบริการลูกค้าหรือไม่',
  'คุณสะดวกใช้งานโปรแกรม Microsoft Office ได้ดีหรือไม่',
  'คุณสามารถสื่อสารภาษาไทยได้อย่างคล่องแคล่วหรือไม่',
];

const BENEFITS_BASE = [
  'ประกันสังคมและกองทุนสำรองเลี้ยงชีพ',
  'ประกันสุขภาพกลุ่มและประกันอุบัติเหตุ',
  'วันลาพักร้อนสูงสุด 12 วันต่อปี',
  'โบนัสประจำปีตามผลประกอบการ',
  'งบพัฒนาทักษะและอบรมประจำปี',
];

/* ------------------------------------------------------------------ */
/* สร้างชุดข้อมูล                                                       */
/* ------------------------------------------------------------------ */

function slugify(title: string, index: number): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return ascii ? `${ascii}-${index + 1}` : `job-${index + 1}`;
}

function daysAgoToIso(days: number): string {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildJob(seed: Seed, index: number): Job {
  const company = COMPANIES[seed.company];
  const requirements =
    REQUIREMENT_TEMPLATES[seed.category] ?? GENERIC_REQUIREMENTS;

  return {
    id: `job-${String(index + 1).padStart(3, '0')}`,
    slug: slugify(seed.title, index),
    title: seed.title,
    company,
    category: seed.category,
    subcategory: seed.sub,
    province: seed.province,
    district: seed.district,
    workStyle: seed.workStyle,
    employmentType: seed.employmentType,
    experienceLevel: seed.experienceLevel,
    salaryMin: seed.salaryMin,
    salaryMax: seed.salaryMax,
    salaryNegotiable: seed.negotiable ?? seed.salaryMax === 0,
    postedAt: daysAgoToIso(seed.daysAgo),
    isUrgent: seed.isUrgent,
    summary: seed.summary,
    description: `${company.legalName} ${seed.summary} ${WORK_STYLE_TEXT[seed.workStyle]}`,
    requirements: [...requirements],
    additionalQualifications: [
      'วุฒิการศึกษาระดับปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง',
      EXPERIENCE_TEXT[seed.experienceLevel],
      `มีความชำนาญด้าน ${seed.skills.slice(0, 3).join(', ')}`,
      'สื่อสารและทำงานเป็นทีมได้ดี มีความรับผิดชอบสูง',
    ],
    employerAnswers: EMPLOYER_ANSWERS,
    benefits: BENEFITS_BASE,
    skills: seed.skills,
    openings: seed.openings ?? 1,
  };
}

export const MOCK_JOBS: Job[] = SEEDS.map(buildJob);

export const MOCK_COMPANIES: Company[] = Object.values(COMPANIES);

export function findCompany(slugOrId: string): Company | undefined {
  return MOCK_COMPANIES.find((c) => c.slug === slugOrId || c.id === slugOrId);
}
