import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { EXPERIENCE_LEVELS, type ExperienceLevel, type QueryJobsDto } from "./dto/query-jobs.dto";

/** อายุงานในฐานข้อมูลเก็บเป็นช่วง จอแสดงเป็น "n ปีขึ้นไป" จึงใช้ค่าขั้นต่ำของช่วง */
const EXPERIENCE_MIN_YEARS: Record<ExperienceLevel, number> = {
  NONE: 0,
  ONE_TWO: 1,
  THREE_FIVE: 3,
  SIX_TEN: 6,
  TEN_PLUS: 10,
};

const WORK_STYLE_LABEL: Record<string, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export interface AdminJobRow {
  id: string;
  companyName: string;
  title: string;
  description?: string;
  experienceLevel: ExperienceLevel;
  experienceMinYears: number;
  salaryMin: number;
  salaryMax: number;
  salaryNegotiable: boolean;
  workStyle: string;
  isActive: boolean;
  isUrgent: boolean;
  postedAt: string;
}

@Injectable()
export class AdminJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryJobsDto) {
    const where: Prisma.JobWhereInput = { deletedAt: null };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { company: { name: { contains: query.q, mode: "insensitive" } } },
      ];
    }
    if (query.experience) where.experienceLevel = query.experience;
    if (query.title) where.title = query.title;
    if (query.salaryMin !== undefined && query.salaryMin > 0) where.salaryMin = { gte: query.salaryMin };

    const total = await this.prisma.job.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);

    const rows = await this.prisma.job.findMany({
      where,
      include: { company: { select: { name: true } } },
      orderBy: [{ postedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return {
      items: rows.map(
        (row): AdminJobRow => ({
          id: row.id,
          companyName: row.company.name,
          title: row.title,
          description: row.description,
          experienceLevel: row.experienceLevel as ExperienceLevel,
          experienceMinYears: EXPERIENCE_MIN_YEARS[row.experienceLevel as ExperienceLevel],
          salaryMin: row.salaryMin,
          salaryMax: row.salaryMax,
          salaryNegotiable: row.salaryNegotiable,
          workStyle: WORK_STYLE_LABEL[row.workStyle] ?? row.workStyle,
          isActive: row.isActive,
          isUrgent: row.isUrgent,
          postedAt: row.postedAt.toISOString(),
        }),
      ),
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    };
  }

  /** ตัวเลือกของ dropdown ในแถบตัวกรอง */
  async filterOptions() {
    const titles = await this.prisma.job.findMany({
      where: { deletedAt: null },
      distinct: ["title"],
      select: { title: true },
      orderBy: { title: "asc" },
    });

    return {
      experiences: EXPERIENCE_LEVELS.map((value) => ({ value, minYears: EXPERIENCE_MIN_YEARS[value] })),
      titles: titles.map((row) => row.title),
    };
  }

  /**
   * ลบแบบ soft delete – Bookmark และ Application ผูก onDelete: Cascade กับ Job
   * ลบจริงจะทำให้ประวัติการสมัครของผู้สมัครหายไปด้วย
   * ตั้ง isActive = false ด้วย เพราะทุก query ฝั่ง member กรอง isActive อยู่แล้ว
   * ประกาศจึงหายจากหน้าเว็บทันทีโดยไม่ต้องแก้ API ฝั่งนั้น
   */
  async softDelete(id: string): Promise<{ ok: true }> {
    const result = await this.prisma.job.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    if (result.count === 0) throw new NotFoundException("ไม่พบประกาศงานนี้ หรือถูกลบไปแล้ว");
    return { ok: true };
  }
}
