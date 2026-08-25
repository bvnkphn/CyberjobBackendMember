import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Job, JobQuery, Paginated, Suggestion } from '@cyberjob/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  toDbEmploymentType,
  toDbExperienceLevel,
  toDbWorkStyle,
  toJobDto,
} from '../common/mappers';

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;
/** จำนวนแถวสูงสุดที่สแกนเพื่อทำ Search Auto */
const SUGGEST_SCAN_LIMIT = 500;

/** กัน limit ที่เป็น NaN / ติดลบ / ใหญ่เกินไป จากพารามิเตอร์ที่ผู้ใช้ส่งมา */
export function clampLimit(value: number | undefined, fallback: number, max = 50): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(1, Math.floor(value)), max);
}

/** include ที่ใช้ทุกครั้ง เพื่อให้ mapper มีข้อมูลบริษัทครบ */
const WITH_COMPANY = { company: true } as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------------------------------------------------------- */
  /* สร้างเงื่อนไข WHERE จากตัวกรอง (Feature 3.1 + 3.2)                 */
  /* ---------------------------------------------------------------- */

  private buildWhere(query: JobQuery): Prisma.JobWhereInput {
    const and: Prisma.JobWhereInput[] = [];

    if (query.q?.trim()) {
      const term = query.q.trim();
      and.push({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { summary: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } },
          { subcategory: { contains: term, mode: 'insensitive' } },
          { skills: { has: term } },
          { company: { name: { contains: term, mode: 'insensitive' } } },
          { company: { legalName: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    // สาขาอาชีพ – รับได้ทั้งชื่อกลุ่มและสาขาย่อย
    if (query.category) {
      and.push({
        OR: [{ category: query.category }, { subcategory: query.category }],
      });
    }

    if (query.province?.length) {
      and.push({ province: { in: query.province } });
    }

    if (query.workStyle?.length) {
      and.push({ workStyle: { in: query.workStyle.map(toDbWorkStyle) } });
    }

    if (query.employmentType?.length) {
      and.push({
        employmentType: { in: query.employmentType.map(toDbEmploymentType) },
      });
    }

    if (query.experience?.length) {
      and.push({
        experienceLevel: { in: query.experience.map(toDbExperienceLevel) },
      });
    }

    // เงินเดือนเป็น Range: ถือว่าตรงเมื่อช่วงของงานทับซ้อนกับช่วงที่เลือก
    if (typeof query.salaryMin === 'number') {
      and.push({
        OR: [
          { salaryNegotiable: true },
          { salaryMax: { gte: query.salaryMin } },
        ],
      });
    }
    if (typeof query.salaryMax === 'number') {
      and.push({
        OR: [
          { salaryNegotiable: true },
          { salaryMin: { lte: query.salaryMax } },
        ],
      });
    }

    if (query.postedWithin && query.postedWithin !== 'all') {
      and.push({ postedAt: { gte: startOfDaysAgo(Number(query.postedWithin)) } });
    }

    if (query.companySlug) {
      and.push({ company: { slug: query.companySlug } });
    }

    return and.length ? { isActive: true, AND: and } : { isActive: true };
  }

  private buildOrderBy(
    sort: JobQuery['sort'],
  ): Prisma.JobOrderByWithRelationInput[] {
    switch (sort) {
      case 'oldest':
        return [{ postedAt: 'asc' }];
      case 'salary_desc':
        return [{ salaryMax: 'desc' }, { postedAt: 'desc' }];
      case 'salary_asc':
        return [{ salaryMin: 'asc' }, { postedAt: 'desc' }];
      case 'newest':
      default:
        return [{ postedAt: 'desc' }];
    }
  }

  /* ---------------------------------------------------------------- */
  /* Feature 3.1 + 3.2 + 3.3                                          */
  /* ---------------------------------------------------------------- */

  async search(query: JobQuery): Promise<Paginated<Job>> {
    const where = this.buildWhere(query);
    const pageSize = Math.min(
      Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const total = await this.prisma.job.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, query.page ?? 1), totalPages);

    const rows = await this.prisma.job.findMany({
      where,
      include: WITH_COMPANY,
      orderBy: this.buildOrderBy(query.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map(toJobDto),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Feature 3.1 – Search Auto
   * ให้ความสำคัญกับการขึ้นต้นด้วยตัวอักษรที่พิมพ์ (ทั้งต้นประโยคและต้นคำ)
   */
  async suggest(term: string, limit = 8): Promise<Suggestion[]> {
    const q = term.trim();
    if (!q) return [];
    const take = clampLimit(limit, 8, 20);

    // ดึงเฉพาะฟิลด์ที่ใช้ แล้วคัดด้วยกฎ "ขึ้นต้นด้วย" ใน JS
    // เพราะ PostgreSQL array (skills) เทียบแบบขึ้นต้นผ่าน Prisma ตรง ๆ ไม่ได้
    // ถ้าจำนวนประกาศงานโตมาก ให้ย้ายไปใช้ $queryRaw กับ unnest(skills) ILIKE
    const rows = await this.prisma.job.findMany({
      where: { isActive: true },
      select: {
        title: true,
        skills: true,
        company: { select: { name: true } },
      },
      orderBy: [{ postedAt: 'desc' }],
      take: SUGGEST_SCAN_LIMIT,
    });

    const lower = q.toLowerCase();
    const startsWithTerm = (value: string) => {
      const v = value.toLowerCase();
      return v.startsWith(lower) || v.split(/[\s(/-]+/).some((w) => w.startsWith(lower));
    };

    const bucket = new Map<string, Suggestion>();
    const add = (type: Suggestion['type'], value: string) => {
      const key = `${type}:${value}`;
      const found = bucket.get(key);
      if (found) found.count += 1;
      else bucket.set(key, { type, value, count: 1 });
    };

    for (const row of rows) {
      if (startsWithTerm(row.title)) add('title', row.title);
      if (startsWithTerm(row.company.name)) add('company', row.company.name);
      for (const skill of row.skills) {
        if (startsWithTerm(skill)) add('skill', skill);
      }
    }

    const order: Record<Suggestion['type'], number> = {
      title: 0,
      company: 1,
      skill: 2,
    };
    return [...bucket.values()]
      .sort((a, b) => order[a.type] - order[b.type] || b.count - a.count)
      .slice(0, take);
  }

  /** ตำแหน่งงานแนะนำบนหน้าแรก */
  async recommended(limit = 3): Promise<Job[]> {
    const rows = await this.prisma.job.findMany({
      where: { isActive: true },
      include: WITH_COMPANY,
      orderBy: [{ postedAt: 'desc' }],
      take: clampLimit(limit, 3, 24),
    });
    return rows.map(toJobDto);
  }

  async findOne(idOrSlug: string): Promise<Job> {
    const row = await this.prisma.job.findFirst({
      where: { isActive: true, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: WITH_COMPANY,
    });
    if (!row) throw new NotFoundException(`ไม่พบประกาศงาน: ${idOrSlug}`);
    return toJobDto(row);
  }

  /** "งานที่แนะนำ" ท้ายหน้ารายละเอียดงาน – ไล่จากใกล้เคียงที่สุดลงมา */
  async related(idOrSlug: string, limit = 2): Promise<Job[]> {
    const take = clampLimit(limit, 2, 12);
    const job = await this.findOne(idOrSlug);

    // เรียงจากใกล้เคียงมากไปน้อย – ข้าม tier ที่ไม่มีข้อมูลให้เทียบ
    const tiers: Prisma.JobWhereInput[] = [
      ...(job.subcategory
        ? [{ subcategory: job.subcategory, id: { not: job.id } }]
        : []),
      { category: job.category, id: { not: job.id } },
      { company: { slug: job.company.slug }, id: { not: job.id } },
      { province: job.province, id: { not: job.id } },
    ];

    const picked = new Map<string, Job>();
    for (const where of tiers) {
      if (picked.size >= take) break;
      const rows = await this.prisma.job.findMany({
        where: { isActive: true, ...where },
        include: WITH_COMPANY,
        orderBy: [{ postedAt: 'desc' }],
        take: take * 2,
      });
      for (const row of rows) {
        if (picked.size >= take) break;
        if (!picked.has(row.id)) picked.set(row.id, toJobDto(row));
      }
    }

    return [...picked.values()].slice(0, take);
  }

  /** ใช้เติมรายการ bookmark ที่ผู้ใช้บันทึกไว้ (Feature 7.1) */
  async findMany(ids: string[]): Promise<Job[]> {
    if (!ids.length) return [];
    const rows = await this.prisma.job.findMany({
      where: { isActive: true, id: { in: ids } },
      include: WITH_COMPANY,
      orderBy: [{ postedAt: 'desc' }],
    });
    return rows.map(toJobDto);
  }
}

/** เริ่มต้นของวันเมื่อ n วันก่อน (นับเป็นวันปฏิทิน) */
function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}
