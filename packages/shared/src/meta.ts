import type {
  EmploymentType,
  ExperienceLevel,
  FilterOption,
  JobSort,
  PostedWithin,
  TreeNode,
  WorkStyle,
} from './types';

/* ------------------------------------------------------------------ */
/* สาขาอาชีพ – Feature 3.1 (กลุ่ม → สาขาย่อย)                          */
/* ------------------------------------------------------------------ */

export const CATEGORY_TREE: TreeNode[] = [
  {
    value: 'E-commerce',
    labelTh: 'E-commerce',
    labelEn: 'E-commerce',
    children: [
      { value: 'การตลาดออนไลน์', labelTh: 'การตลาดออนไลน์', labelEn: 'Online marketing' },
      { value: 'บริหารร้านค้าออนไลน์', labelTh: 'บริหารร้านค้าออนไลน์', labelEn: 'Online store management' },
      { value: 'Live Commerce', labelTh: 'Live Commerce', labelEn: 'Live commerce' },
    ],
  },
  {
    value: 'Part-time/พนักงานสัญญาจ้าง/นักศึกษาฝึกงาน',
    labelTh: 'Part-time/พนักงานสัญญาจ้าง/นักศึกษาฝึกงาน',
    labelEn: 'Part-time / Contract / Internship',
    children: [
      { value: 'งานพาร์ทไทม์', labelTh: 'งานพาร์ทไทม์', labelEn: 'Part-time' },
      { value: 'พนักงานสัญญาจ้าง', labelTh: 'พนักงานสัญญาจ้าง', labelEn: 'Contract staff' },
      { value: 'นักศึกษาฝึกงาน', labelTh: 'นักศึกษาฝึกงาน', labelEn: 'Internship' },
    ],
  },
  {
    value: 'Sustainability/ESG',
    labelTh: 'Sustainability/ESG',
    labelEn: 'Sustainability / ESG',
    children: [
      { value: 'ความยั่งยืนองค์กร', labelTh: 'ความยั่งยืนองค์กร', labelEn: 'Corporate sustainability' },
      { value: 'สิ่งแวดล้อมและความปลอดภัย', labelTh: 'สิ่งแวดล้อมและความปลอดภัย', labelEn: 'Environment & safety' },
    ],
  },
  {
    value: 'กฎหมาย',
    labelTh: 'กฎหมาย',
    labelEn: 'Legal',
    children: [
      { value: 'ทนายความ', labelTh: 'ทนายความ', labelEn: 'Lawyer' },
      { value: 'นิติกร', labelTh: 'นิติกร', labelEn: 'Legal officer' },
      { value: 'ที่ปรึกษากฎหมาย', labelTh: 'ที่ปรึกษากฎหมาย', labelEn: 'Legal counsel' },
    ],
  },
  {
    value: 'ก่อสร้าง',
    labelTh: 'ก่อสร้าง',
    labelEn: 'Construction',
    children: [
      { value: 'ควบคุมงานก่อสร้าง', labelTh: 'ควบคุมงานก่อสร้าง', labelEn: 'Site supervision' },
      { value: 'ประมาณราคา', labelTh: 'ประมาณราคา', labelEn: 'Quantity surveying' },
      { value: 'วิศวกรโยธา', labelTh: 'วิศวกรโยธา', labelEn: 'Civil engineering' },
    ],
  },
  {
    value: 'การขาย',
    labelTh: 'การขาย',
    labelEn: 'Sales',
    children: [
      { value: 'ขายในประเทศ', labelTh: 'ขายในประเทศ', labelEn: 'Domestic sales' },
      { value: 'ขายต่างประเทศ', labelTh: 'ขายต่างประเทศ', labelEn: 'International sales' },
      { value: 'พัฒนาธุรกิจ', labelTh: 'พัฒนาธุรกิจ', labelEn: 'Business development' },
    ],
  },
  {
    value: 'การตลาดและประชาสัมพันธ์',
    labelTh: 'การตลาดและประชาสัมพันธ์',
    labelEn: 'Marketing & PR',
    children: [
      { value: 'การตลาดดิจิทัล', labelTh: 'การตลาดดิจิทัล', labelEn: 'Digital marketing' },
      { value: 'แบรนด์และคอนเทนต์', labelTh: 'แบรนด์และคอนเทนต์', labelEn: 'Brand & content' },
      { value: 'ประชาสัมพันธ์', labelTh: 'ประชาสัมพันธ์', labelEn: 'Public relations' },
    ],
  },
  {
    value: 'การผลิต',
    labelTh: 'การผลิต',
    labelEn: 'Manufacturing',
    children: [
      { value: 'วิศวกรรมการผลิต', labelTh: 'วิศวกรรมการผลิต', labelEn: 'Production engineering' },
      { value: 'ควบคุมคุณภาพ', labelTh: 'ควบคุมคุณภาพ', labelEn: 'Quality control' },
      { value: 'ซ่อมบำรุง', labelTh: 'ซ่อมบำรุง', labelEn: 'Maintenance' },
    ],
  },
  {
    value: 'การเงินและบัญชี',
    labelTh: 'การเงินและบัญชี',
    labelEn: 'Finance & Accounting',
    children: [
      { value: 'บัญชี', labelTh: 'บัญชี', labelEn: 'Accounting' },
      { value: 'การเงิน', labelTh: 'การเงิน', labelEn: 'Finance' },
      { value: 'ตรวจสอบภายใน', labelTh: 'ตรวจสอบภายใน', labelEn: 'Internal audit' },
      { value: 'วิเคราะห์ข้อมูลธุรกิจ', labelTh: 'วิเคราะห์ข้อมูลธุรกิจ', labelEn: 'Business analysis' },
    ],
  },
  {
    value: 'ขนส่งและโลจิสติกส์',
    labelTh: 'ขนส่งและโลจิสติกส์',
    labelEn: 'Transport & Logistics',
    children: [
      { value: 'คลังสินค้า', labelTh: 'คลังสินค้า', labelEn: 'Warehouse' },
      { value: 'วางแผนอุปทาน', labelTh: 'วางแผนอุปทาน', labelEn: 'Supply planning' },
      { value: 'จัดส่งและกระจายสินค้า', labelTh: 'จัดส่งและกระจายสินค้า', labelEn: 'Distribution' },
    ],
  },
  {
    value: 'ทรัพยากรบุคคล',
    labelTh: 'ทรัพยากรบุคคล',
    labelEn: 'Human Resources',
    children: [
      { value: 'สรรหาบุคลากร', labelTh: 'สรรหาบุคลากร', labelEn: 'Recruitment' },
      { value: 'ค่าตอบแทนและสวัสดิการ', labelTh: 'ค่าตอบแทนและสวัสดิการ', labelEn: 'Compensation & benefits' },
      { value: 'ธุรการและงานเอกสาร', labelTh: 'ธุรการและงานเอกสาร', labelEn: 'Administration' },
      { value: 'พัฒนาบุคลากร', labelTh: 'พัฒนาบุคลากร', labelEn: 'People development' },
    ],
  },
  {
    value: 'เทคโนโลยีสารสนเทศ',
    labelTh: 'เทคโนโลยีสารสนเทศ',
    labelEn: 'Information Technology',
    children: [
      { value: 'พัฒนาซอฟต์แวร์', labelTh: 'พัฒนาซอฟต์แวร์', labelEn: 'Software development' },
      { value: 'ดูแลระบบและเครือข่าย', labelTh: 'ดูแลระบบและเครือข่าย', labelEn: 'Infrastructure & network' },
      { value: 'ความปลอดภัยไซเบอร์', labelTh: 'ความปลอดภัยไซเบอร์', labelEn: 'Cyber security' },
      { value: 'ข้อมูลและ AI', labelTh: 'ข้อมูลและ AI', labelEn: 'Data & AI' },
      { value: 'บริหารผลิตภัณฑ์', labelTh: 'บริหารผลิตภัณฑ์', labelEn: 'Product management' },
      { value: 'ทดสอบคุณภาพซอฟต์แวร์', labelTh: 'ทดสอบคุณภาพซอฟต์แวร์', labelEn: 'QA' },
      { value: 'สนับสนุนด้านไอที', labelTh: 'สนับสนุนด้านไอที', labelEn: 'IT support' },
    ],
  },
  {
    value: 'บริการลูกค้า',
    labelTh: 'บริการลูกค้า',
    labelEn: 'Customer Service',
    children: [
      { value: 'คอลเซ็นเตอร์', labelTh: 'คอลเซ็นเตอร์', labelEn: 'Call centre' },
      { value: 'ลูกค้าสัมพันธ์', labelTh: 'ลูกค้าสัมพันธ์', labelEn: 'Customer relations' },
    ],
  },
  {
    value: 'ศิลปะ สื่อ และการออกแบบ',
    labelTh: 'ศิลปะ สื่อ และการออกแบบ',
    labelEn: 'Arts, Media & Design',
    children: [
      { value: 'กราฟิกดีไซน์', labelTh: 'กราฟิกดีไซน์', labelEn: 'Graphic design' },
      { value: 'UX/UI', labelTh: 'UX/UI', labelEn: 'UX/UI' },
      { value: 'มัลติมีเดียและวิดีโอ', labelTh: 'มัลติมีเดียและวิดีโอ', labelEn: 'Multimedia & video' },
    ],
  },
  {
    value: 'สุขภาพและการแพทย์',
    labelTh: 'สุขภาพและการแพทย์',
    labelEn: 'Healthcare & Medical',
    children: [
      { value: 'พยาบาล', labelTh: 'พยาบาล', labelEn: 'Nursing' },
      { value: 'เภสัชกรรม', labelTh: 'เภสัชกรรม', labelEn: 'Pharmacy' },
      { value: 'เทคนิคการแพทย์', labelTh: 'เทคนิคการแพทย์', labelEn: 'Medical technology' },
    ],
  },
  {
    value: 'โรงแรมและการท่องเที่ยว',
    labelTh: 'โรงแรมและการท่องเที่ยว',
    labelEn: 'Hospitality & Tourism',
    children: [
      { value: 'บริการส่วนหน้า', labelTh: 'บริการส่วนหน้า', labelEn: 'Front office' },
      { value: 'อาหารและเครื่องดื่ม', labelTh: 'อาหารและเครื่องดื่ม', labelEn: 'Food & beverage' },
    ],
  },
];

/** รายชื่อกลุ่มสาขาอาชีพ (ใช้เวลาต้องการรายการแบน ๆ) */
export const CATEGORIES: string[] = CATEGORY_TREE.map((c) => c.value);

/* ------------------------------------------------------------------ */
/* สถานที่ทำงาน – ภาค → จังหวัด (Feature 3.1)                          */
/* ------------------------------------------------------------------ */

export const REGION_TREE: TreeNode[] = [
  {
    value: 'กรุงเทพและปริมณฑล',
    labelTh: 'กรุงเทพและปริมณฑล',
    labelEn: 'Bangkok & vicinity',
    children: [
      { value: 'กรุงเทพมหานคร', labelTh: 'กรุงเทพมหานคร', labelEn: 'Bangkok' },
      { value: 'นครปฐม', labelTh: 'นครปฐม', labelEn: 'Nakhon Pathom' },
      { value: 'นนทบุรี', labelTh: 'นนทบุรี', labelEn: 'Nonthaburi' },
      { value: 'ปทุมธานี', labelTh: 'ปทุมธานี', labelEn: 'Pathum Thani' },
      { value: 'สมุทรปราการ', labelTh: 'สมุทรปราการ', labelEn: 'Samut Prakan' },
      { value: 'สมุทรสาคร', labelTh: 'สมุทรสาคร', labelEn: 'Samut Sakhon' },
    ],
  },
  {
    value: 'ภาคกลาง',
    labelTh: 'ภาคกลาง',
    labelEn: 'Central',
    children: [
      { value: 'พระนครศรีอยุธยา', labelTh: 'พระนครศรีอยุธยา', labelEn: 'Ayutthaya' },
      { value: 'สระบุรี', labelTh: 'สระบุรี', labelEn: 'Saraburi' },
      { value: 'ลพบุรี', labelTh: 'ลพบุรี', labelEn: 'Lopburi' },
    ],
  },
  {
    value: 'ภาคตะวันออก',
    labelTh: 'ภาคตะวันออก',
    labelEn: 'East',
    children: [
      { value: 'ชลบุรี', labelTh: 'ชลบุรี', labelEn: 'Chonburi' },
      { value: 'ระยอง', labelTh: 'ระยอง', labelEn: 'Rayong' },
      { value: 'ฉะเชิงเทรา', labelTh: 'ฉะเชิงเทรา', labelEn: 'Chachoengsao' },
    ],
  },
  {
    value: 'ภาคเหนือ',
    labelTh: 'ภาคเหนือ',
    labelEn: 'North',
    children: [
      { value: 'เชียงใหม่', labelTh: 'เชียงใหม่', labelEn: 'Chiang Mai' },
      { value: 'เชียงราย', labelTh: 'เชียงราย', labelEn: 'Chiang Rai' },
      { value: 'พิษณุโลก', labelTh: 'พิษณุโลก', labelEn: 'Phitsanulok' },
    ],
  },
  {
    value: 'ภาคตะวันออกเฉียงเหนือ',
    labelTh: 'ภาคตะวันออกเฉียงเหนือ',
    labelEn: 'Northeast',
    children: [
      { value: 'ขอนแก่น', labelTh: 'ขอนแก่น', labelEn: 'Khon Kaen' },
      { value: 'นครราชสีมา', labelTh: 'นครราชสีมา', labelEn: 'Nakhon Ratchasima' },
      { value: 'อุดรธานี', labelTh: 'อุดรธานี', labelEn: 'Udon Thani' },
    ],
  },
  {
    value: 'ภาคใต้',
    labelTh: 'ภาคใต้',
    labelEn: 'South',
    children: [
      { value: 'ภูเก็ต', labelTh: 'ภูเก็ต', labelEn: 'Phuket' },
      { value: 'สงขลา', labelTh: 'สงขลา', labelEn: 'Songkhla' },
      { value: 'สุราษฎร์ธานี', labelTh: 'สุราษฎร์ธานี', labelEn: 'Surat Thani' },
    ],
  },
];

/** รายชื่อจังหวัดทั้งหมด (แบน) */
export const PROVINCES: string[] = REGION_TREE.flatMap((r) =>
  (r.children ?? []).map((c) => c.value),
);

/** ภาค → รายชื่อจังหวัดในภาคนั้น */
export function provincesOfRegion(region: string): string[] {
  const found = REGION_TREE.find((r) => r.value === region);
  return found ? (found.children ?? []).map((c) => c.value) : [];
}

/* ------------------------------------------------------------------ */
/* ตัวเลือกอื่น ๆ                                                       */
/* ------------------------------------------------------------------ */

export const WORK_STYLES: FilterOption<WorkStyle>[] = [
  { value: 'onsite', labelTh: 'เข้าออฟฟิศ', labelEn: 'On-site' },
  { value: 'hybrid', labelTh: 'ไฮบริด', labelEn: 'Hybrid' },
  { value: 'remote', labelTh: 'ทำงานที่บ้าน', labelEn: 'Remote' },
];

export const EMPLOYMENT_TYPES: FilterOption<EmploymentType>[] = [
  { value: 'fulltime', labelTh: 'งานประจำ', labelEn: 'Full-time' },
  { value: 'parttime', labelTh: 'งานพาร์ทไทม์', labelEn: 'Part-time' },
  { value: 'contract', labelTh: 'สัญญาจ้าง', labelEn: 'Contract' },
  { value: 'temporary', labelTh: 'งานชั่วคราว', labelEn: 'Temporary' },
  { value: 'internship', labelTh: 'ฝึกงาน', labelEn: 'Internship' },
];

export const EXPERIENCE_LEVELS: FilterOption<ExperienceLevel>[] = [
  { value: '0', labelTh: '0 ปี', labelEn: '0 years' },
  { value: '1-2', labelTh: '1-2 ปี', labelEn: '1-2 years' },
  { value: '3-5', labelTh: '3-5 ปี', labelEn: '3-5 years' },
  { value: '6-10', labelTh: '6-10 ปี', labelEn: '6-10 years' },
  { value: '10+', labelTh: '10+ ปี', labelEn: '10+ years' },
];

export const POSTED_WITHIN: FilterOption<PostedWithin>[] = [
  { value: 'all', labelTh: 'ทุกเวลา', labelEn: 'Any time' },
  { value: '1', labelTh: 'วันนี้', labelEn: 'Today' },
  { value: '3', labelTh: '3 วันที่ผ่านมา', labelEn: 'Last 3 days' },
  { value: '7', labelTh: '7 วันที่ผ่านมา', labelEn: 'Last 7 days' },
  { value: '14', labelTh: '14 วันที่ผ่านมา', labelEn: 'Last 14 days' },
  { value: '30', labelTh: '30 วันที่ผ่านมา', labelEn: 'Last 30 days' },
];

/** Default = ใหม่ไปเก่า (Feature 3.3) */
export const SORTS: FilterOption<JobSort>[] = [
  { value: 'newest', labelTh: 'ใหม่ไปเก่า', labelEn: 'Newest first' },
  { value: 'oldest', labelTh: 'เก่าไปใหม่', labelEn: 'Oldest first' },
  { value: 'salary_desc', labelTh: 'เงินเดือนสูงไปต่ำ', labelEn: 'Highest salary' },
  { value: 'salary_asc', labelTh: 'เงินเดือนต่ำไปสูง', labelEn: 'Lowest salary' },
];

const SALARY_STEPS = [
  0, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000,
  120000, 150000, 200000,
];

export const SALARY_RANGE = {
  min: 0,
  max: 200000,
  step: 5000,
  options: SALARY_STEPS,
};
