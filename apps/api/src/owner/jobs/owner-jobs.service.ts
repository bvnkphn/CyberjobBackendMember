import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Company, ExperienceLevel, Job, JobQuestion, JobStatus, Prisma, QuestionType } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CandidatePoolService } from "../candidates/candidate-pool.service";
import { matchCandidateToJob } from "../common/matching";
import { effectivePlan, PLANS } from "../common/plans";
import { desiredPositions, expectedSalaryRange } from "../common/resume";
import type { JobQuestionDto, QueryJobsDto, SaveJobDto } from "./dto";

const STATUS_TO_API = { DRAFT: "draft", PUBLISHED: "published", CLOSED: "closed" } as const;
const WORK_STYLE = { onsite: "ONSITE", hybrid: "HYBRID", remote: "REMOTE" } as const;
const WORK_STYLE_TO_API = { ONSITE: "onsite", HYBRID: "hybrid", REMOTE: "remote" } as const;
const EMPLOYMENT = { fulltime: "FULLTIME", contract: "CONTRACT", temporary: "TEMPORARY" } as const;
const EMPLOYMENT_TO_API = {
  FULLTIME: "fulltime",
  PARTTIME: "parttime",
  CONTRACT: "contract",
  TEMPORARY: "temporary",
  INTERNSHIP: "internship",
} as const;
const QUESTION_TYPE = { single: "SINGLE", date: "DATE", short: "SHORT", multi: "MULTI", long: "LONG" } as const;
const QUESTION_TYPE_TO_API: Record<QuestionType, keyof typeof QUESTION_TYPE> = {
  SINGLE: "single",
  DATE: "date",
  SHORT: "short",
  MULTI: "multi",
  LONG: "long",
};
const LEVEL_MIN_YEARS: Record<ExperienceLevel, number> = { NONE: 0, ONE_TWO: 1, THREE_FIVE: 3, SIX_TEN: 6, TEN_PLUS: 10 };

/** จำนวนปีประสบการณ์ → ช่วงที่หน้าเว็บ member ใช้กรอง */
function experienceLevelOf(years: number): ExperienceLevel {
  if (years <= 0) return "NONE";
  if (years <= 2) return "ONE_TWO";
  if (years <= 5) return "THREE_FIVE";
  if (years <= 10) return "SIX_TEN";
  return "TEN_PLUS";
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "job"}-${randomBytes(3).toString("hex")}`;
}

function cleanList(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) seen.set(trimmed.toLowerCase(), trimmed);
  }
  return [...seen.values()];
}

type JobWithCount = Job & { _count: { applications: number } };

@Injectable()
export class OwnerJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pool: CandidatePoolService,
  ) {}

  private memberJobUrl(job: Job): string | null {
    if (job.status !== "PUBLISHED") return null;
    const base = (process.env.MEMBER_WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return `${base}/jobs/${job.id}`;
  }

  private toListItem(job: JobWithCount, company: Company) {
    return {
      id: job.id,
      slug: job.slug,
      title: job.title,
      status: STATUS_TO_API[job.status],
      category: job.category,
      subcategory: job.subcategory,
      department: job.department,
      workStyle: WORK_STYLE_TO_API[job.workStyle],
      employmentType: EMPLOYMENT_TO_API[job.employmentType],
      experienceYears: job.experienceYears ?? LEVEL_MIN_YEARS[job.experienceLevel],
      openings: job.openings,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryNegotiable: job.salaryNegotiable,
      isUrgent: job.isUrgent,
      province: job.province,
      postedAt: job.postedAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      applicantCount: job._count.applications,
      memberUrl: this.memberJobUrl(job),
      company: {
        name: company.name,
        businessType: company.businessType,
        logoUrl: company.logoUrl,
        logoText: company.logoText,
        logoColor: company.logoColor,
      },
    };
  }

  private async findOwn(companyId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { applications: true } }, questions: { orderBy: { position: "asc" } } },
    });
    if (!job) throw new NotFoundException("ไม่พบประกาศงานนี้");
    return job;
  }

  /* ---------------- รายการ (Feature 4.1) ---------------- */

  async list(companyId: string | null, query: QueryJobsDto) {
    const company = await this.pool.company(companyId);
    const term = query.q?.trim();
    const jobs = await this.prisma.job.findMany({
      where: {
        companyId: company.id,
        deletedAt: null,
        ...(term ? { title: { contains: term, mode: "insensitive" } } : {}),
      },
      include: { _count: { select: { applications: true } } },
      orderBy: [{ updatedAt: "desc" }],
    });

    const counts = {
      all: jobs.length,
      published: jobs.filter((job) => job.status === "PUBLISHED").length,
      draft: jobs.filter((job) => job.status === "DRAFT").length,
      closed: jobs.filter((job) => job.status === "CLOSED").length,
    };
    const items = jobs
      .filter((job) => query.status === "all" || STATUS_TO_API[job.status] === query.status)
      .map((job) => this.toListItem(job, company));

    return { items, total: items.length, counts, usage: await this.usage(company) };
  }

  /** โควตาการประกาศตามแพ็กเกจ – หน้าเว็บใช้แสดงว่ายังโพสต์ได้อีกกี่ครั้ง */
  async usage(company: Company) {
    const plan = effectivePlan(company);
    const definition = PLANS[plan];
    const [everPublished, active] = await Promise.all([
      this.prisma.job.count({ where: { companyId: company.id, status: { in: ["PUBLISHED", "CLOSED"] } } }),
      this.prisma.job.count({ where: { companyId: company.id, status: "PUBLISHED", deletedAt: null } }),
    ]);
    return {
      plan,
      verified: company.verificationStatus === "APPROVED",
      lifetimePosts: definition.lifetimePosts,
      postsUsed: everPublished,
      maxActiveJobs: definition.maxActiveJobs,
      activeJobs: active,
      canPublish:
        company.verificationStatus === "APPROVED" &&
        (definition.lifetimePosts === null || everPublished < definition.lifetimePosts) &&
        (definition.maxActiveJobs === null || active < definition.maxActiveJobs),
    };
  }

  /* ---------------- รายละเอียด + ผู้สมัคร (Feature 4.1.1) ---------------- */

  async detail(companyId: string | null, id: string) {
    const company = await this.pool.company(companyId);
    const job = await this.findOwn(company.id, id);

    const applications = await this.prisma.application.findMany({
      where: { jobId: job.id },
      select: { id: true, userId: true, createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
    });
    const pool = await this.pool.load(company.id, applications.map((application) => application.userId));
    const byId = new Map(pool.candidates.map((candidate) => [candidate.summary.id, candidate]));
    const matchJob = this.pool.toMatchJob(job);

    const applicants = applications.flatMap((application) => {
      const candidate = byId.get(application.userId);
      if (!candidate) return [];
      const match = matchCandidateToJob(
        {
          skills: candidate.summary.skills,
          positions: desiredPositions(candidate.sections),
          experienceYears: candidate.summary.experienceYears,
          salary: expectedSalaryRange(candidate.sections),
        },
        matchJob,
      );
      return [
        {
          applicationId: application.id,
          candidateId: candidate.summary.id,
          code: candidate.summary.code,
          name: candidate.summary.name,
          avatarUrl: candidate.summary.avatarUrl,
          position: candidate.summary.position,
          appliedAt: application.createdAt.toISOString(),
          status: application.status,
          resumeScore: candidate.summary.resumeScore,
          matchingScore: match.score,
        },
      ];
    });

    return {
      ...this.toListItem(job, company),
      description: job.description,
      skills: job.skills,
      benefits: job.benefits,
      questions: job.questions.map((question) => this.toQuestion(question)),
      applicants,
    };
  }

  private toQuestion(question: JobQuestion) {
    return {
      id: question.id,
      type: QUESTION_TYPE_TO_API[question.type],
      text: question.text,
      options: question.options,
      required: question.required,
    };
  }

  /* ---------------- สร้าง / แก้ไข (Feature 4.2) ---------------- */

  /**
   * ตรวจก่อนเผยแพร่
   *  - บริษัทต้องผ่านการยืนยันแล้ว
   *  - FREE โพสต์ได้ 3 ครั้งแรก (นับประกาศที่เคยเผยแพร่ทั้งหมด) · GOLD เปิดพร้อมกันได้ 15 ประกาศ
   */
  private async assertCanPublish(company: Company, current: Job | null) {
    if (company.verificationStatus !== "APPROVED") {
      throw new ForbiddenException({
        statusCode: 403,
        code: "VERIFICATION_REQUIRED",
        message: "เฉพาะบริษัทที่ยืนยันแล้วเท่านั้นที่สามารถประกาศงานได้ บันทึกเป็นฉบับร่างไว้ก่อนได้",
      });
    }
    if (current?.status === "PUBLISHED") return;

    const definition = PLANS[effectivePlan(company)];
    const others = current ? { id: { not: current.id } } : {};

    if (definition.lifetimePosts !== null && current?.status !== "CLOSED") {
      const used = await this.prisma.job.count({
        where: { companyId: company.id, status: { in: ["PUBLISHED", "CLOSED"] }, ...others },
      });
      if (used >= definition.lifetimePosts) {
        throw new ForbiddenException({
          statusCode: 403,
          code: "PLAN_LIMIT",
          message: `แพ็กเกจ ${definition.name} โพสต์งานได้ ${definition.lifetimePosts} ครั้ง อัปเกรดแพ็กเกจเพื่อประกาศเพิ่ม`,
        });
      }
    }

    if (definition.maxActiveJobs !== null) {
      const active = await this.prisma.job.count({
        where: { companyId: company.id, status: "PUBLISHED", deletedAt: null, ...others },
      });
      if (active >= definition.maxActiveJobs) {
        throw new ForbiddenException({
          statusCode: 403,
          code: "PLAN_LIMIT",
          message: `แพ็กเกจ ${definition.name} เปิดรับสมัครพร้อมกันได้สูงสุด ${definition.maxActiveJobs} ประกาศ`,
        });
      }
    }
  }

  private validate(dto: SaveJobDto) {
    if (dto.salaryMax < dto.salaryMin) throw new BadRequestException("เงินเดือนสูงสุดต้องไม่น้อยกว่าเงินเดือนต่ำสุด");
    if (dto.status === "published") {
      if (dto.description.trim().length < 20) throw new BadRequestException("กรุณาระบุรายละเอียดงานอย่างน้อย 20 ตัวอักษร");
      if (dto.salaryMax <= 0) throw new BadRequestException("กรุณาระบุช่วงเงินเดือน");
    }
    for (const question of dto.questions) {
      if ((question.type === "single" || question.type === "multi") && cleanList(question.options).length < 2) {
        throw new BadRequestException(`คำถาม "${question.text}" ต้องมีตัวเลือกอย่างน้อย 2 ข้อ`);
      }
    }
  }

  private jobData(dto: SaveJobDto, company: Company) {
    const description = dto.description.trim();
    return {
      title: dto.title.trim(),
      category: dto.category.trim(),
      subcategory: dto.subcategory?.trim() || null,
      department: dto.department?.trim() || null,
      province: company.province,
      district: company.district,
      workStyle: WORK_STYLE[dto.workStyle],
      employmentType: EMPLOYMENT[dto.employmentType],
      experienceYears: dto.experienceYears,
      experienceLevel: experienceLevelOf(dto.experienceYears),
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryNegotiable: dto.salaryNegotiable,
      isUrgent: dto.isUrgent,
      openings: dto.openings,
      description,
      summary: description.replace(/\s+/g, " ").slice(0, 160),
      skills: cleanList(dto.skills),
      benefits: cleanList(dto.benefits),
    };
  }

  private questionData(question: JobQuestionDto, position: number) {
    const hasOptions = question.type === "single" || question.type === "multi";
    return {
      position,
      type: QUESTION_TYPE[question.type],
      text: question.text.trim(),
      options: hasOptions ? cleanList(question.options) : [],
      required: question.required,
    };
  }

  async create(companyId: string | null, dto: SaveJobDto) {
    const company = await this.pool.company(companyId);
    this.validate(dto);
    if (dto.status === "published") await this.assertCanPublish(company, null);

    const status: JobStatus = dto.status === "published" ? "PUBLISHED" : "DRAFT";
    const job = await this.prisma.job.create({
      data: {
        ...this.jobData(dto, company),
        slug: slugify(dto.title),
        companyId: company.id,
        status,
        isActive: status === "PUBLISHED",
        postedAt: new Date(),
        questions: { create: dto.questions.map((question, index) => this.questionData(question, index)) },
      },
    });
    return this.detail(company.id, job.id);
  }

  async update(companyId: string | null, id: string, dto: SaveJobDto) {
    const company = await this.pool.company(companyId);
    const current = await this.findOwn(company.id, id);
    this.validate(dto);

    // ประกาศที่ปิดรับแล้วแก้ไขได้ แต่คงสถานะปิดไว้ – เปิดใหม่ผ่าน /publish
    let status: JobStatus = current.status;
    if (dto.status === "published" && current.status !== "CLOSED") {
      await this.assertCanPublish(company, current);
      status = "PUBLISHED";
    } else if (dto.status === "draft" && current.status !== "CLOSED") {
      status = "DRAFT";
    }

    const keepIds = dto.questions.map((question) => question.id).filter((value): value is string => Boolean(value));
    const unknown = keepIds.filter((questionId) => !current.questions.some((question) => question.id === questionId));
    if (unknown.length) throw new BadRequestException("มีคำถามที่ไม่อยู่ในประกาศงานนี้");

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.job.update({
        where: { id: current.id },
        data: {
          ...this.jobData(dto, company),
          status,
          isActive: status === "PUBLISHED",
          // เผยแพร่ครั้งแรกจากฉบับร่าง นับวันประกาศจากตอนนี้
          ...(current.status === "DRAFT" && status === "PUBLISHED" ? { postedAt: new Date() } : {}),
        },
      });
      // คำถามที่ถูกลบออก คำตอบเดิมยังอยู่ (questionId ถูกตั้งเป็น null แต่เก็บข้อความคำถามไว้แล้ว)
      await tx.jobQuestion.deleteMany({ where: { jobId: current.id, id: { notIn: keepIds } } });
      for (const [index, question] of dto.questions.entries()) {
        const data = this.questionData(question, index);
        if (question.id) {
          await tx.jobQuestion.update({ where: { id: question.id }, data });
        } else {
          await tx.jobQuestion.create({ data: { ...data, jobId: current.id } });
        }
      }
    });

    return this.detail(company.id, current.id);
  }

  /* ---------------- ปิด / เปิดใหม่ / ลบ ---------------- */

  async close(companyId: string | null, id: string) {
    const company = await this.pool.company(companyId);
    const job = await this.findOwn(company.id, id);
    if (job.status !== "PUBLISHED") throw new BadRequestException("ปิดรับสมัครได้เฉพาะประกาศที่เปิดรับอยู่");
    await this.prisma.job.update({ where: { id: job.id }, data: { status: "CLOSED", isActive: false } });
    return this.detail(company.id, job.id);
  }

  async publish(companyId: string | null, id: string) {
    const company = await this.pool.company(companyId);
    const job = await this.findOwn(company.id, id);
    if (job.status === "PUBLISHED") return this.detail(company.id, job.id);
    if (job.description.trim().length < 20 || job.salaryMax <= 0) {
      throw new BadRequestException("กรุณากรอกรายละเอียดงานและเงินเดือนให้ครบก่อนเผยแพร่");
    }
    await this.assertCanPublish(company, job);
    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: "PUBLISHED",
        isActive: true,
        ...(job.status === "DRAFT" ? { postedAt: new Date() } : {}),
      },
    });
    return this.detail(company.id, job.id);
  }

  /** ลบแบบ soft delete เหมือนฝั่ง admin – ประวัติการสมัครและคำตอบยังอยู่ */
  async remove(companyId: string | null, id: string) {
    const company = await this.pool.company(companyId);
    const job = await this.findOwn(company.id, id);
    await this.prisma.job.update({ where: { id: job.id }, data: { deletedAt: new Date(), isActive: false } });
    return { ok: true };
  }
}
