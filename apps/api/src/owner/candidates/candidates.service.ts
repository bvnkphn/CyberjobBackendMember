import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { InvitationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { matchCandidateToJob } from "../common/matching";
import { buildResume, certificates, desiredPositions, expectedSalaryRange } from "../common/resume";
import { CandidatePoolService, type CandidatePool, type CandidateSummary } from "./candidate-pool.service";
import type { InviteDto, QueryCandidatesDto, QueryInvitationsDto, QueryResponsesDto } from "./dto";

const DAY = 24 * 60 * 60 * 1000;

const QUESTION_TYPE = { SINGLE: "single", DATE: "date", SHORT: "short", MULTI: "multi", LONG: "long" } as const;
const INVITATION_STATUS: Record<InvitationStatus, "sent" | "accepted" | "declined"> = {
  SENT: "sent",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

function includesText(haystack: Array<string | null | undefined>, term: string): boolean {
  return haystack.filter(Boolean).join(" ").toLowerCase().includes(term);
}

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pool: CandidatePoolService,
  ) {}

  /* ---------------- ผู้สมัครทั้งหมด / ผู้ที่สมัครเข้ามา (Feature 2.1, 2.2) ---------------- */

  async list(companyId: string | null, query: QueryCandidatesDto) {
    const pool = await this.pool.load(companyId);

    if (query.source === "cyberjob" && !pool.talentSearch) {
      throw new ForbiddenException({
        statusCode: 403,
        code: "PLAN_REQUIRED",
        message: "แพ็กเกจ FREE ดูได้เฉพาะผู้ที่สมัครงานของบริษัท อัปเกรดเป็น GOLD เพื่อค้นหาผู้สมัครทั้งระบบ",
      });
    }

    const visible = pool.candidates.filter((candidate) =>
      query.source === "company"
        ? candidate.summary.isApplicant
        : candidate.hasProfile && (candidate.summary.isPublic || candidate.summary.isApplicant),
    );

    const allSkills = [...new Set(visible.flatMap((candidate) => candidate.summary.skills))].sort((a, b) =>
      a.localeCompare(b, "th"),
    );

    const term = query.q?.trim().toLowerCase();
    const wantedSkills = query.skills.map((skill) => skill.toLowerCase());
    const scoreMin = query.scoreMin ?? 0;
    const scoreMax = query.scoreMax ?? 100;

    const filtered = visible
      .map((candidate) => candidate.summary)
      .filter((summary) => {
        if (query.jobId && !summary.appliedJobs.some((job) => job.id === query.jobId)) return false;
        if (term && !includesText([summary.name, summary.code, summary.email, summary.position, ...summary.skills], term)) {
          return false;
        }
        if (query.expMin !== undefined && summary.experienceYears < query.expMin) return false;
        if (query.expMax !== undefined && summary.experienceYears > query.expMax) return false;
        if (wantedSkills.length) {
          const own = summary.skills.map((skill) => skill.toLowerCase());
          if (!wantedSkills.every((skill) => own.includes(skill))) return false;
        }
        if (query.scoreMin !== undefined || query.scoreMax !== undefined) {
          const score = summary.resumeScore ?? 0;
          if (score < scoreMin || score > scoreMax) return false;
        }
        return true;
      });

    // ผู้ที่สมัครเข้ามาเรียงตามวันที่สมัคร ผู้สมัครทั้งระบบเรียงตามวันที่ลงทะเบียน
    const dateOf = (summary: CandidateSummary) =>
      query.source === "company" ? (summary.lastAppliedAt ?? summary.registeredAt) : summary.registeredAt;
    filtered.sort((a, b) => {
      if (query.sort === "matching") return (b.matchingScore ?? -1) - (a.matchingScore ?? -1);
      const diff = dateOf(a).localeCompare(dateOf(b));
      return query.sort === "oldest" ? diff : -diff;
    });

    const start = (query.page - 1) * query.pageSize;
    return {
      items: filtered.slice(start, start + query.pageSize),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      skills: allSkills,
      talentSearch: pool.talentSearch,
      plan: pool.plan,
    };
  }

  /* ---------------- รายละเอียด / Resume (Feature 2.1.3.2) ---------------- */

  async detail(companyId: string | null, candidateId: string, jobId?: string) {
    const pool = await this.pool.load(companyId);
    const candidate = this.pool.find(pool, candidateId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: candidateId }, select: { name: true, email: true } });

    let match = candidate.match;
    if (jobId) {
      const job = pool.jobsById.get(jobId);
      if (!job) throw new NotFoundException("ไม่พบประกาศงานนี้");
      match = matchCandidateToJob(
        {
          skills: candidate.summary.skills,
          positions: desiredPositions(candidate.sections),
          experienceYears: candidate.summary.experienceYears,
          salary: expectedSalaryRange(candidate.sections),
        },
        job,
      );
    }

    const [applications, invitations] = await Promise.all([
      this.prisma.application.findMany({
        where: { userId: candidateId, job: { companyId: pool.company.id, deletedAt: null } },
        include: { job: { select: { id: true, title: true } }, answers: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.invitation.findMany({
        where: { candidateId, companyId: pool.company.id },
        include: { job: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      ...candidate.summary,
      resume: buildResume(user, { address: candidate.profileAddress }, candidate.sections),
      certificates: certificates(candidate.sections),
      match,
      applications: applications.map((application) => ({
        id: application.id,
        job: application.job,
        status: application.status,
        appliedAt: application.createdAt.toISOString(),
        answers: application.answers.map((answer) => ({
          question: answer.questionText,
          type: QUESTION_TYPE[answer.questionType],
          answer: answer.answer as string | string[],
        })),
      })),
      invitationHistory: invitations.map((invitation) => ({
        id: invitation.id,
        job: invitation.job,
        status: INVITATION_STATUS[invitation.status],
        createdAt: invitation.createdAt.toISOString(),
        respondedAt: invitation.respondedAt?.toISOString() ?? null,
      })),
    };
  }

  /* ---------------- ผู้สมัครที่บันทึกไว้ (Feature 2.3) ---------------- */

  async bookmarks(companyId: string | null) {
    const pool = await this.pool.load(companyId);
    const rows = await this.prisma.candidateBookmark.findMany({
      where: { companyId: pool.company.id },
      orderBy: { createdAt: "desc" },
      select: { candidateId: true, createdAt: true },
    });
    const byId = new Map(pool.candidates.map((candidate) => [candidate.summary.id, candidate.summary]));
    const items = rows
      .map((row) => {
        const summary = byId.get(row.candidateId);
        return summary ? { ...summary, bookmarkedAt: row.createdAt.toISOString() } : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return { items, total: items.length };
  }

  async addBookmark(companyId: string | null, candidateId: string) {
    const pool = await this.pool.load(companyId);
    this.pool.find(pool, candidateId);
    await this.prisma.candidateBookmark.upsert({
      where: { companyId_candidateId: { companyId: pool.company.id, candidateId } },
      update: {},
      create: { companyId: pool.company.id, candidateId },
    });
    return { ok: true, bookmarked: true };
  }

  async removeBookmark(companyId: string | null, candidateId: string) {
    const company = await this.pool.company(companyId);
    await this.prisma.candidateBookmark.deleteMany({ where: { companyId: company.id, candidateId } });
    return { ok: true, bookmarked: false };
  }

  /* ---------------- คำเชิญ (Feature 2.5) ---------------- */

  async invitations(companyId: string | null, query: QueryInvitationsDto) {
    const company = await this.pool.company(companyId);
    const rows = await this.prisma.invitation.findMany({
      where: { companyId: company.id },
      include: {
        job: { select: { id: true, title: true, deletedAt: true } },
        candidate: { select: { id: true, code: true, name: true, avatarUrl: true, email: true } },
      },
      orderBy: { createdAt: query.sort === "oldest" ? "asc" : "desc" },
    });

    const stats = {
      total: rows.length,
      accepted: rows.filter((row) => row.status === "ACCEPTED").length,
      pending: rows.filter((row) => row.status === "SENT").length,
      declined: rows.filter((row) => row.status === "DECLINED").length,
    };

    const term = query.q?.trim().toLowerCase();
    const since = query.days ? Date.now() - query.days * DAY : null;
    const items = rows
      .filter((row) => query.status === "all" || INVITATION_STATUS[row.status] === query.status)
      .filter((row) => !since || row.createdAt.getTime() >= since)
      .filter((row) => !term || includesText([row.candidate.name, row.candidate.code, row.candidate.email, row.job.title], term))
      .map((row) => ({
        id: row.id,
        candidate: { id: row.candidate.id, code: row.candidate.code, name: row.candidate.name, avatarUrl: row.candidate.avatarUrl },
        job: { id: row.job.id, title: row.job.title, deleted: row.job.deletedAt !== null },
        status: INVITATION_STATUS[row.status],
        message: row.message,
        createdAt: row.createdAt.toISOString(),
        respondedAt: row.respondedAt?.toISOString() ?? null,
      }));

    return { items, total: items.length, stats };
  }

  async invite(companyId: string | null, dto: InviteDto) {
    const pool = await this.pool.load(companyId);
    this.pool.find(pool, dto.candidateId);

    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, companyId: pool.company.id, deletedAt: null },
      select: { id: true, title: true, status: true },
    });
    if (!job) throw new NotFoundException("ไม่พบประกาศงานนี้");
    if (job.status !== "PUBLISHED") throw new BadRequestException("เชิญได้เฉพาะประกาศที่เปิดรับสมัครอยู่");

    const applied = await this.prisma.application.findFirst({ where: { userId: dto.candidateId, jobId: job.id }, select: { id: true } });
    if (applied) throw new ConflictException("ผู้สมัครคนนี้สมัครงานนี้แล้ว");

    try {
      const row = await this.prisma.invitation.create({
        data: {
          companyId: pool.company.id,
          candidateId: dto.candidateId,
          jobId: job.id,
          message: dto.message?.trim() || `${pool.company.name} สนใจประวัติของคุณและอยากเชิญให้สมัครตำแหน่ง ${job.title}`,
        },
      });
      return { id: row.id, status: INVITATION_STATUS[row.status], job: { id: job.id, title: job.title }, createdAt: row.createdAt.toISOString() };
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2002") {
        throw new ConflictException("เชิญผู้สมัครคนนี้ในตำแหน่งนี้ไปแล้ว");
      }
      throw error;
    }
  }

  /* ---------------- คำตอบของผู้สมัคร (Feature 2.4) ---------------- */

  async responses(companyId: string | null, query: QueryResponsesDto) {
    const pool: CandidatePool = await this.pool.load(companyId);
    const since = query.days ? new Date(Date.now() - query.days * DAY) : undefined;

    const rows = await this.prisma.application.findMany({
      where: {
        job: { companyId: pool.company.id, deletedAt: null },
        ...(query.jobId ? { jobId: query.jobId } : {}),
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      include: {
        job: { select: { id: true, title: true } },
        answers: { orderBy: { position: "asc" } },
        user: { select: { id: true, code: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summaries = new Map(pool.candidates.map((candidate) => [candidate.summary.id, candidate.summary]));
    const term = query.q?.trim().toLowerCase();

    const items = rows
      .filter((row) => !term || includesText([row.user.name, row.user.code], term))
      .map((row) => ({
        applicationId: row.id,
        candidate: {
          id: row.user.id,
          code: row.user.code,
          name: row.user.name,
          avatarUrl: row.user.avatarUrl,
          position: summaries.get(row.user.id)?.position ?? null,
          resumeScore: summaries.get(row.user.id)?.resumeScore ?? null,
        },
        job: row.job,
        appliedAt: row.createdAt.toISOString(),
        answers: row.answers.map((answer) => ({
          question: answer.questionText,
          type: QUESTION_TYPE[answer.questionType],
          answer: answer.answer as string | string[],
        })),
      }));

    const jobs = [...pool.jobsById.values()].map((job) => ({ id: job.id, title: job.title }));
    return { items, total: items.length, jobs };
  }
}
