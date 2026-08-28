/**
 * CyberJob – shared domain types
 * Used by both apps/api (NestJS) and apps/web (Next.js service layer).
 */

/** รูปแบบการทำงาน – Feature 3.2 */
export type WorkStyle = 'onsite' | 'hybrid' | 'remote';

/** ประเภทงาน (เก็บไว้ในข้อมูล แต่ไม่แสดงเป็นตัวกรองในดีไซน์ปัจจุบัน) */
export type EmploymentType =
  | 'fulltime'
  | 'parttime'
  | 'contract'
  | 'temporary'
  | 'internship';

/** ประสบการณ์ทำงาน – Feature 3.2 */
export type ExperienceLevel = '0' | '1-2' | '3-5' | '6-10' | '10+';

/** ประกาศเมื่อ – Feature 3.2 (จำนวนวันย้อนหลัง, 'all' = ทุกเวลา) */
export type PostedWithin = 'all' | '1' | '3' | '7' | '14' | '30';

/** การเรียงลำดับ – Feature 3.3 (default = newest) */
export type JobSort = 'newest' | 'oldest' | 'salary_desc' | 'salary_asc';

export interface CompanyContact {
  email: string;
  phone: string;
  website: string;
  /** ที่อยู่เต็มสำหรับหน้าโปรไฟล์บริษัท */
  address: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  /** ชื่อภาษาอังกฤษที่แสดงใต้การ์ดผลการค้นหา */
  legalName: string;
  /** ตัวอักษรย่อที่ใช้แทนโลโก้บริษัท */
  logoText: string;
  /** สีพื้นหลังโลโก้ */
  logoColor: string;
  /** ผ่านการยืนยันตัวตนแล้ว (แสดงเครื่องหมายถูกสีเขียว) */
  verified: boolean;
  /** ประเภทธุรกิจ */
  businessType: string;
  employeeCount?: string;
  about: string;
  contact: CompanyContact;
  /** จังหวัด/เขตที่ตั้งบริษัท */
  province: string;
  district?: string;
  /** URL รูป cover – เว้นว่างได้ ระบบจะใช้ภาพ placeholder แทน */
  coverImage?: string;
  /** รูปบรรยากาศบริษัท */
  gallery?: string[];
  /** พิกัดสำหรับแผนที่ */
  location?: { lat: number; lng: number };
}

export interface Job {
  id: string;
  slug: string;
  /** ตำแหน่งที่เปิดรับ */
  title: string;
  company: Company;
  /** สาขาอาชีพหลัก (ตรงกับกลุ่มใน CATEGORY_TREE) */
  category: string;
  /** สาขาอาชีพย่อย */
  subcategory?: string;
  /** สถานที่ทำงาน (จังหวัด) – Feature 3.1 */
  province: string;
  district?: string;
  workStyle: WorkStyle;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  /** เงินเดือน เป็น Range ต่ำสุด–สูงสุด – Feature 3.2 */
  salaryMin: number;
  salaryMax: number;
  /** true = ระบุว่า "ตามตกลง" */
  salaryNegotiable?: boolean;
  /** ISO date – ใช้คำนวณ "ประกาศมากี่วัน" */
  postedAt: string;
  /** งานด่วน */
  isUrgent?: boolean;
  /** ประกาศงานโดยย่อ (แสดงในการ์ดฝั่งซ้าย) */
  summary: string;
  /** Job Description */
  description: string;
  /** Job Requirement */
  requirements: string[];
  /** คุณสมบัติเพิ่มเติม */
  additionalQualifications: string[];
  /** คำตอบจากผู้ประกอบการ */
  employerAnswers: string[];
  benefits: string[];
  skills: string[];
  /** จำนวนอัตราที่รับ */
  openings: number;
  /** รูป cover ของประกาศ – เว้นว่างได้ */
  coverImage?: string;
}

/** เงื่อนไขการค้นหา + แยกหมวดหมู่ (Feature 3.1 + 3.2) */
export interface JobQuery {
  /** คำค้น: ชื่อตำแหน่งงาน / ทักษะ / ชื่อบริษัท */
  q?: string;
  /** สาขาอาชีพ – รับได้ทั้งชื่อกลุ่มและสาขาย่อย */
  category?: string;
  /** จังหวัด – เลือกได้หลายจังหวัด (เช่นเลือกทั้งภาค) */
  province?: string[];
  workStyle?: WorkStyle[];
  employmentType?: EmploymentType[];
  experience?: ExperienceLevel[];
  salaryMin?: number;
  salaryMax?: number;
  postedWithin?: PostedWithin;
  sort?: JobSort;
  page?: number;
  pageSize?: number;
  /** จำกัดเฉพาะงานของบริษัทหนึ่ง (ใช้ในหน้าโปรไฟล์บริษัท) */
  companySlug?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FilterOption<T extends string = string> {
  value: T;
  labelTh: string;
  labelEn: string;
}

/** โหนดของต้นไม้ตัวเลือก (สาขาอาชีพ / สถานที่ทำงาน) */
export interface TreeNode {
  value: string;
  labelTh: string;
  labelEn: string;
  children?: TreeNode[];
}

/** ตัวเลือกทั้งหมดของแผงกรอง – ให้ frontend เรียกครั้งเดียว */
export interface FilterMeta {
  /** สาขาอาชีพแบบต้นไม้ (กลุ่ม → สาขาย่อย) */
  categoryTree: TreeNode[];
  /** สถานที่ทำงานแบบต้นไม้ (ภาค → จังหวัด) */
  regionTree: TreeNode[];
  workStyles: FilterOption<WorkStyle>[];
  employmentTypes: FilterOption<EmploymentType>[];
  experienceLevels: FilterOption<ExperienceLevel>[];
  postedWithin: FilterOption<PostedWithin>[];
  sorts: FilterOption<JobSort>[];
  salary: { min: number; max: number; step: number; options: number[] };
}

/** ผลลัพธ์ Search Auto (autocomplete) – Feature 3.1 */
export interface Suggestion {
  type: 'title' | 'company' | 'skill';
  value: string;
  count: number;
}

/* ------------------------------------------------------------------ */
/* ผู้ใช้และการยืนยันตัวตน                                               */
/* ------------------------------------------------------------------ */

export type UserRole = 'JOBSEEKER' | 'EMPLOYER' | 'ADMIN';
export type AuthProviderName = 'LOCAL' | 'GOOGLE';

/** ข้อมูลผู้ใช้ที่ปลอดภัยพอจะส่งให้ frontend */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  provider: AuthProviderName;
  gateCompleted: boolean;
  createdAt: string;
}

/** ผลลัพธ์ของการสมัคร / เข้าสู่ระบบ / ต่ออายุ token */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  /** วินาทีจนกว่า accessToken จะหมดอายุ */
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** งานที่ผู้ใช้สมัครไว้ */
export type ApplicationStatus =
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'HIRED';

export interface JobApplication {
  id: string;
  job: Job;
  status: ApplicationStatus;
  coverLetter?: string;
  createdAt: string;
}

/** ฟอร์มติดต่อฝ่ายสนับสนุน – Feature 3.4 */
export interface SupportRequest {
  name: string;
  email: string;
  topic: string;
  message: string;
}
