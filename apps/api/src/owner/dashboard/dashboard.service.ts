import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CandidatePoolService } from "../candidates/candidate-pool.service";
import { matchCandidateToJob } from "../common/matching";
import { desiredPositions, expectedSalaryRange } from "../common/resume";

const DAY = 24 * 60 * 60 * 1000;

export interface OwnerNotification {
  id: string;
  type: "application" | "invitation_accepted" | "invitation_declined";
  title: string;
  detail: string;
  createdAt: string;
  link: string;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pool: CandidatePoolService,
  ) {}

  /** หน้าหลัก (Owner Feature 1) */
  async overview(companyId: string | null) {
    const pool = await this.pool.load(companyId);
    const company = pool.company;
    const weekAgo = new Date(Date.now() - 7 * DAY);

    const [jobs, applications, bookmarks, invitations, notifications] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId: company.id, deletedAt: null },
        select: { id: true, title: true, status: true, skills: true, experienceYears: true, salaryMin: true, salaryMax: true },
      }),
      this.prisma.application.findMany({
        where: { job: { companyId: company.id, deletedAt: null } },
        select: { id: true, userId: true, jobId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.candidateBookmark.count({ where: { companyId: company.id } }),
      this.prisma.invitation.groupBy({ by: ["status"], where: { companyId: company.id }, _count: { _all: true } }),
      this.notifications(company.id, 8),
    ]);

    const candidates = new Map(pool.candidates.map((candidate) => [candidate.summary.id, candidate]));
    const jobsById = new Map(jobs.map((job) => [job.id, job]));

    const applicantView = (application: (typeof applications)[number]) => {
      const candidate = candidates.get(application.userId);
      const job = jobsById.get(application.jobId);
      if (!candidate || !job) return null;
      const match = matchCandidateToJob(
        {
          skills: candidate.summary.skills,
          positions: desiredPositions(candidate.sections),
          experienceYears: candidate.summary.experienceYears,
          salary: expectedSalaryRange(candidate.sections),
        },
        this.pool.toMatchJob(job),
      );
      return {
        applicationId: application.id,
        candidateId: candidate.summary.id,
        name: candidate.summary.name,
        avatarUrl: candidate.summary.avatarUrl,
        position: candidate.summary.position,
        skills: candidate.summary.skills.slice(0, 3),
        job: { id: job.id, title: job.title },
        appliedAt: application.createdAt.toISOString(),
        resumeScore: candidate.summary.resumeScore,
        matchingScore: match.score,
      };
    };

    // แยกตามตำแหน่ง เรียงตำแหน่งที่มีคนสมัครล่าสุดขึ้นก่อน (ค่าเริ่มต้นใหม่ → เก่า)
    const byPosition = new Map<string, typeof applications>();
    for (const application of applications) {
      byPosition.set(application.jobId, [...(byPosition.get(application.jobId) ?? []), application]);
    }
    const applicantsByPosition = [...byPosition.entries()]
      .map(([jobId, rows]) => {
        const job = jobsById.get(jobId)!;
        return {
          job: { id: job.id, title: job.title, status: job.status.toLowerCase() },
          count: rows.length,
          latestAt: rows[0].createdAt.toISOString(),
          applicants: rows.slice(0, 4).map(applicantView).filter(Boolean),
        };
      })
      .sort((a, b) => b.latestAt.localeCompare(a.latestAt));

    const invitationCount = (status: "SENT" | "ACCEPTED" | "DECLINED") =>
      invitations.find((row) => row.status === status)?._count._all ?? 0;

    return {
      company: { name: company.name, logoUrl: company.logoUrl, logoText: company.logoText, logoColor: company.logoColor },
      plan: pool.plan,
      talentSearch: pool.talentSearch,
      verificationStatus: company.verificationStatus.toLowerCase(),
      stats: {
        jobPosts: jobs.filter((job) => job.status === "PUBLISHED").length,
        totalJobs: jobs.length,
        applicants: applications.length,
        applicantsThisWeek: applications.filter((application) => application.createdAt >= weekAgo).length,
        bookmarked: bookmarks,
        invites: invitationCount("SENT") + invitationCount("ACCEPTED") + invitationCount("DECLINED"),
        invitesPending: invitationCount("SENT"),
        invitesAccepted: invitationCount("ACCEPTED"),
      },
      applicantsByPosition,
      latestApplicants: applications.slice(0, 8).map(applicantView).filter(Boolean),
      notifications,
    };
  }

  /** การแจ้งเตือนล่าสุด (Feature 1.5) – สร้างจากใบสมัครและการตอบคำเชิญ ไม่ได้เก็บแยกตาราง */
  async notifications(companyId: string | null, limit = 20): Promise<OwnerNotification[]> {
    const company = await this.pool.company(companyId);
    const [applications, responses] = await Promise.all([
      this.prisma.application.findMany({
        where: { job: { companyId: company.id, deletedAt: null } },
        select: { id: true, createdAt: true, user: { select: { name: true } }, job: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.invitation.findMany({
        where: { companyId: company.id, status: { in: ["ACCEPTED", "DECLINED"] }, respondedAt: { not: null } },
        select: { id: true, status: true, respondedAt: true, candidate: { select: { name: true } }, job: { select: { title: true } } },
        orderBy: { respondedAt: "desc" },
        take: limit,
      }),
    ]);

    const items: OwnerNotification[] = [
      ...applications.map((row) => ({
        id: `application-${row.id}`,
        type: "application" as const,
        title: `${row.user.name} สมัครงาน`,
        detail: `ตำแหน่ง ${row.job.title}`,
        createdAt: row.createdAt.toISOString(),
        link: "/candidates/responses",
      })),
      ...responses.map((row) => ({
        id: `invitation-${row.id}`,
        type: row.status === "ACCEPTED" ? ("invitation_accepted" as const) : ("invitation_declined" as const),
        title: `${row.candidate.name} ${row.status === "ACCEPTED" ? "ตอบรับ" : "ปฏิเสธ"}คำเชิญ`,
        detail: `ตำแหน่ง ${row.job.title}`,
        createdAt: row.respondedAt!.toISOString(),
        link: "/candidates/invitations",
      })),
    ];

    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
}
