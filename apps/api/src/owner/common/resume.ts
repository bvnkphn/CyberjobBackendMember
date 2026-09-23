/**
 * อ่านข้อมูลเรซูเม่จาก CandidateProfile.sections (JSON) ที่ฝั่ง member บันทึกไว้
 * โครงสร้างคีย์เป็นแบบแบน เช่น workExperience1StartYear, certificate2Title
 */

type Sections = Record<string, Record<string, unknown>>;

const MAX_REPEAT = 5;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

export function asSections(value: unknown): Sections {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Sections) : {};
}

/**
 * น้ำหนักต้องตรงกับ GateService.calculateCompletion ฝั่ง member
 * ถ้าฝั่งนั้นเปลี่ยนสูตร ต้องแก้ที่นี่ด้วย ไม่งั้นคะแนนสองระบบจะไม่ตรงกัน
 */
const COMPLETION_WEIGHTS: Record<string, Record<string, number>> = {
  personal: { firstName: 4, lastName: 4, gender: 3, birthDay: 3, birthMonth: 3, birthYear: 3, nationality: 3, phone: 5, address: 7 },
  desiredJob: { desiredPosition1: 8, desiredJobType1: 6, workplacePreference: 3, availableStartDate: 3 },
  educations: { education1Level: 4, education1Institution: 4, education1Faculty: 2, education1Year: 3, education1Major: 2 },
  workExperiences: { workExperience1StartMonth: 1, workExperience1StartYear: 1, workExperience1EndMonth: 1, workExperience1EndYear: 1, workExperience1Company: 3, workExperience1Position: 3 },
  languages: { language1Name: 2, language1Listening: 2, language1Speaking: 2, language1Reading: 2, language1Writing: 2 },
  certificates: { certificate1Title: 2.5, certificate1FileName: 2.5 },
  otherSkills: { specialty1: 3, projects: 2 },
};

export function resumeScore(sections: Sections): number {
  let score = 0;
  for (const [section, fields] of Object.entries(COMPLETION_WEIGHTS)) {
    for (const [field, weight] of Object.entries(fields)) {
      if (text(sections[section]?.[field])) score += weight;
    }
  }
  return Math.round(score);
}

/** ฟอร์มฝั่ง member ใช้ปี พ.ศ. แต่รองรับ ค.ศ. ไว้ด้วยเผื่อข้อมูลจากแหล่งอื่น */
function toGregorianYear(value: unknown): number | null {
  const year = Number(text(value));
  if (!Number.isFinite(year) || year <= 0) return null;
  return year > 2400 ? year - 543 : year;
}

function toMonth(value: unknown, fallback: number): number {
  const month = Number(text(value));
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback;
}

/**
 * อายุงานรวม (ปีเต็ม) จากประวัติการทำงานทุกรายการ
 * รายการที่ไม่มีปีสิ้นสุดถือว่ายังทำอยู่ นับถึงวันนี้
 */
export function experienceYears(sections: Sections, now = new Date()): number {
  const work = sections.workExperiences ?? {};
  let months = 0;

  for (let index = 1; index <= MAX_REPEAT; index += 1) {
    const startYear = toGregorianYear(work[`workExperience${index}StartYear`]);
    if (!startYear) continue;

    const startMonth = toMonth(work[`workExperience${index}StartMonth`], 1);
    const endYear = toGregorianYear(work[`workExperience${index}EndYear`]) ?? now.getFullYear();
    const endMonth = toGregorianYear(work[`workExperience${index}EndYear`])
      ? toMonth(work[`workExperience${index}EndMonth`], 12)
      : now.getMonth() + 1;

    months += Math.max(0, (endYear - startYear) * 12 + (endMonth - startMonth));
  }

  return Math.floor(months / 12);
}

export function desiredPositions(sections: Sections): string[] {
  const desired = sections.desiredJob ?? {};
  const positions: string[] = [];
  for (let index = 1; index <= MAX_REPEAT; index += 1) {
    const value = text(desired[`desiredPosition${index}`]);
    if (value) positions.push(value);
  }
  return positions;
}

export interface Certificate {
  title: string;
  issuer: string | null;
  fileName: string | null;
}

/**
 * หมายเหตุ: ฝั่ง member ยังไม่ได้อัปโหลดไฟล์จริง เก็บแค่ชื่อไฟล์
 * จึงยังไม่มี URL ให้เปิดดูรูปใบประกาศนียบัตร
 */
export function certificates(sections: Sections): Certificate[] {
  const source = sections.certificates ?? {};
  const list: Certificate[] = [];
  for (let index = 1; index <= MAX_REPEAT; index += 1) {
    const title = text(source[`certificate${index}Title`]);
    const fileName = text(source[`certificate${index}FileName`]);
    if (!title && !fileName) continue;
    list.push({
      title: title || fileName,
      issuer: text(source[`certificate${index}Issuer`]) || null,
      fileName: fileName || null,
    });
  }
  return list;
}

export interface Resume {
  contact: { name: string; email: string; phone: string | null; address: string | null };
  desiredPositions: string[];
  educations: Array<{ degree: string; major: string | null; institution: string; year: string | null; gpa: string | null }>;
  specialties: string[];
  languages: Array<{ name: string; level: string }>;
  workExperiences: Array<{ position: string; company: string; period: string; description: string | null }>;
  projects: string | null;
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function periodLabel(month: unknown, year: unknown): string | null {
  const y = text(year);
  if (!y) return null;
  const m = Number(text(month));
  return Number.isInteger(m) && m >= 1 && m <= 12 ? `${THAI_MONTHS[m - 1]} ${y}` : y;
}

export function buildResume(
  user: { name: string; email: string },
  profile: { address: string | null } | null,
  sections: Sections,
): Resume {
  const personal = sections.personal ?? {};
  const educationsSource = sections.educations ?? {};
  const work = sections.workExperiences ?? {};
  const languagesSource = sections.languages ?? {};
  const other = sections.otherSkills ?? {};

  const educations: Resume["educations"] = [];
  const workExperiences: Resume["workExperiences"] = [];
  const languages: Resume["languages"] = [];
  const specialties: string[] = [];

  for (let index = 1; index <= MAX_REPEAT; index += 1) {
    const institution = text(educationsSource[`education${index}Institution`]);
    if (institution) {
      educations.push({
        degree: text(educationsSource[`education${index}Level`]) || "-",
        major: text(educationsSource[`education${index}Major`]) || null,
        institution,
        year: text(educationsSource[`education${index}Year`]) || null,
        gpa: text(educationsSource[`education${index}Gpa`]) || null,
      });
    }

    const position = text(work[`workExperience${index}Position`]);
    if (position) {
      const start = periodLabel(work[`workExperience${index}StartMonth`], work[`workExperience${index}StartYear`]);
      const end = periodLabel(work[`workExperience${index}EndMonth`], work[`workExperience${index}EndYear`]) ?? "ปัจจุบัน";
      workExperiences.push({
        position,
        company: text(work[`workExperience${index}Company`]) || "-",
        period: start ? `${start} - ${end}` : end,
        description: text(work[`workExperience${index}Description`]) || null,
      });
    }

    const language = text(languagesSource[`language${index}Name`]);
    if (language) {
      const levels = ["Listening", "Speaking", "Reading", "Writing"]
        .map((skill) => text(languagesSource[`language${index}${skill}`]))
        .filter(Boolean);
      languages.push({ name: language, level: levels.join(" / ") || "-" });
    }

    const specialty = text(other[`specialty${index}`]);
    if (specialty) specialties.push(specialty);
  }

  return {
    contact: {
      name: user.name,
      email: user.email,
      phone: text(personal.phone) || null,
      address: text(personal.address) || profile?.address || null,
    },
    desiredPositions: desiredPositions(sections),
    educations,
    specialties,
    languages,
    workExperiences,
    projects: text(other.projects) || null,
  };
}

/** ทักษะเด่นจากหัวข้อ "ความสามารถพิเศษ" ของเรซูเม่ – แยกรายการที่คั่นด้วยจุลภาคด้วย */
export function skills(sections: Sections): string[] {
  const other = sections.otherSkills ?? {};
  const seen = new Map<string, string>();
  for (let index = 1; index <= MAX_REPEAT; index += 1) {
    const raw = text(other[`specialty${index}`]);
    // "Front-end: HTML, CSS" → ตัดหัวข้อหน้าเครื่องหมาย : ออก เหลือ HTML, CSS
    const body = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
    for (const part of body.split(/[,;\n]/)) {
      const skill = part.trim();
      if (skill && !seen.has(skill.toLowerCase())) seen.set(skill.toLowerCase(), skill);
    }
  }
  return [...seen.values()];
}

/** ช่วงเงินเดือนที่คาดหวังจากตัวเลือกในฟอร์มฝั่ง member เช่น "30,001 - 40,000 บาท" */
export function expectedSalaryRange(sections: Sections): { min: number; max: number | null } | null {
  const raw = text(sections.desiredJob?.expectedSalary);
  const numbers = (raw.match(/\d[\d,]*/g) ?? []).map((value) => Number(value.replace(/,/g, "")));
  if (!numbers.length) return null;
  if (/มากกว่า|ขึ้นไป|\+/.test(raw)) return { min: numbers[0] + 1, max: null };
  return { min: numbers[0], max: numbers[1] ?? numbers[0] };
}

export function expectedSalaryLabel(sections: Sections): string | null {
  return text(sections.desiredJob?.expectedSalary) || null;
}

/** รูปแบบสถานที่ทำงานที่ต้องการ เช่น ไฮบริด */
export function workplacePreference(sections: Sections): string | null {
  return text(sections.desiredJob?.workplacePreference) || null;
}
