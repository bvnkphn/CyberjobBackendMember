import type { Job, JobQuery, Paginated, Suggestion } from './types';

export const DEFAULT_PAGE_SIZE = 8;

/** ตัดช่องว่าง + lower-case สำหรับเทียบข้อความแบบหลวม ๆ */
function norm(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Feature 3.1 – "ใช้ตัวอักษรตัวแรกในการเชื่อมต่อค้นหาตำแหน่งงานทั้งหมดที่มี"
 * ให้คะแนนสูงสุดเมื่อขึ้นต้นตรงกัน แล้วจึงไล่ลงมาเป็น substring
 * คืนค่า -1 หากไม่ตรงเลย
 */
function matchScore(job: Job, term: string): number {
  const t = norm(term);
  if (!t) return 0;

  const title = norm(job.title);
  const company = norm(job.company.name);
  const skills = job.skills.map(norm);
  const category = norm(job.category);

  if (title.startsWith(t)) return 100;
  if (title.split(/\s+/).some((w) => w.startsWith(t))) return 90;
  if (company.startsWith(t)) return 80;
  if (skills.some((s) => s.startsWith(t))) return 70;
  if (title.includes(t)) return 60;
  if (company.includes(t)) return 50;
  if (skills.some((s) => s.includes(t))) return 40;
  if (category.includes(t)) return 30;
  if (norm(job.summary).includes(t)) return 20;
  return -1;
}

/** นับเป็น "วันปฏิทิน" เพื่อให้ผลลัพธ์ตรงกับที่ผู้ใช้เข้าใจ ไม่ขึ้นกับเวลาที่ประกาศ */
function daysSince(iso: string): number {
  const posted = new Date(iso);
  const now = new Date();
  const startOfPostedDay = Date.UTC(
    posted.getFullYear(),
    posted.getMonth(),
    posted.getDate(),
  );
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfToday - startOfPostedDay) / 86_400_000);
}

/** จำนวนวันตั้งแต่ประกาศ – ใช้แสดง "ประกาศมากี่วัน" (Feature 3.3) */
export function postedDaysAgo(iso: string): number {
  return Math.max(0, daysSince(iso));
}

/**
 * กรอง + เรียง + แบ่งหน้า ตาม Feature 3.1 / 3.2 / 3.3
 * ใช้ร่วมกันทั้งฝั่ง NestJS และฝั่ง fallback ของ web
 */
export function searchJobs(
  source: Job[],
  query: JobQuery = {},
): Paginated<Job> {
  const {
    q,
    category,
    province,
    workStyle,
    employmentType,
    experience,
    salaryMin,
    salaryMax,
    postedWithin = 'all',
    sort = 'newest',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    companySlug,
  } = query;

  let scored = source.map((job) => ({ job, score: q ? matchScore(job, q) : 0 }));

  if (q) scored = scored.filter((s) => s.score >= 0);

  // สาขาอาชีพ – รับได้ทั้งชื่อกลุ่มและชื่อสาขาย่อย
  if (category) {
    scored = scored.filter(
      (s) => s.job.category === category || s.job.subcategory === category,
    );
  }

  // จังหวัด – เลือกได้หลายจังหวัด (เช่นเลือกทั้งภาค)
  if (province?.length) {
    scored = scored.filter((s) => province.includes(s.job.province));
  }

  if (companySlug) {
    scored = scored.filter((s) => s.job.company.slug === companySlug);
  }

  if (workStyle?.length) {
    scored = scored.filter((s) => workStyle.includes(s.job.workStyle));
  }
  if (employmentType?.length) {
    scored = scored.filter((s) => employmentType.includes(s.job.employmentType));
  }
  if (experience?.length) {
    scored = scored.filter((s) => experience.includes(s.job.experienceLevel));
  }

  // เงินเดือนเป็น Range: นับว่าตรงเมื่อช่วงเงินเดือนของงานทับซ้อนกับช่วงที่ผู้ใช้เลือก
  if (typeof salaryMin === 'number') {
    scored = scored.filter(
      (s) => s.job.salaryNegotiable || s.job.salaryMax >= salaryMin,
    );
  }
  if (typeof salaryMax === 'number') {
    scored = scored.filter(
      (s) => s.job.salaryNegotiable || s.job.salaryMin <= salaryMax,
    );
  }

  if (postedWithin !== 'all') {
    const limit = Number(postedWithin);
    scored = scored.filter((s) => daysSince(s.job.postedAt) < limit);
  }

  const byNewest = (a: Job, b: Job) =>
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();

  scored.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return -byNewest(a.job, b.job);
      case 'salary_desc':
        return b.job.salaryMax - a.job.salaryMax || byNewest(a.job, b.job);
      case 'salary_asc':
        return a.job.salaryMin - b.job.salaryMin || byNewest(a.job, b.job);
      case 'newest':
      default:
        // เมื่อมีคำค้น ให้ความเกี่ยวข้องมาก่อน แล้วจึงเรียงใหม่ไปเก่า
        return q ? b.score - a.score || byNewest(a.job, b.job) : byNewest(a.job, b.job);
    }
  });

  const items = scored.map((s) => s.job);
  const total = items.length;
  const safePageSize = Math.max(1, Math.min(pageSize, 50));
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}

/** Search Auto – Feature 3.1 (แนะนำตำแหน่ง / บริษัท / ทักษะ จากตัวอักษรแรก) */
export function suggest(source: Job[], term: string, limit = 8): Suggestion[] {
  const t = norm(term);
  if (!t) return [];

  const bucket = new Map<string, Suggestion>();

  const add = (type: Suggestion['type'], value: string) => {
    const key = `${type}:${value}`;
    const found = bucket.get(key);
    if (found) found.count += 1;
    else bucket.set(key, { type, value, count: 1 });
  };

  for (const job of source) {
    if (norm(job.title).startsWith(t) || norm(job.title).split(/\s+/).some((w) => w.startsWith(t))) {
      add('title', job.title);
    }
    if (norm(job.company.name).startsWith(t)) {
      add('company', job.company.name);
    }
    for (const skill of job.skills) {
      if (norm(skill).startsWith(t)) add('skill', skill);
    }
  }

  const order: Record<Suggestion['type'], number> = { title: 0, company: 1, skill: 2 };
  return [...bucket.values()]
    .sort((a, b) => order[a.type] - order[b.type] || b.count - a.count)
    .slice(0, limit);
}

/** งานแนะนำบนหน้าแรก (Feature 11) – เรียงจากประกาศใหม่ไปเก่า */
export function recommendedJobs(source: Job[], limit = 3): Job[] {
  return [...source]
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, limit);
}

/**
 * "งานที่แนะนำ" ท้ายหน้ารายละเอียดงาน
 * ให้น้ำหนักงานสาขาเดียวกัน > บริษัทเดียวกัน > จังหวัดเดียวกัน
 */
export function relatedJobs(source: Job[], job: Job, limit = 2): Job[] {
  return source
    .filter((j) => j.id !== job.id)
    .map((j) => {
      let score = 0;
      if (j.subcategory && j.subcategory === job.subcategory) score += 5;
      if (j.category === job.category) score += 3;
      if (j.company.slug === job.company.slug) score += 2;
      if (j.province === job.province) score += 1;
      return { j, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.j.postedAt).getTime() - new Date(a.j.postedAt).getTime(),
    )
    .slice(0, limit)
    .map((s) => s.j);
}
