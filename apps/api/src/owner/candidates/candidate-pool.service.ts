import { Injectable, NotFoundException } from "@nestjs/common";
import type { Company, InvitationStatus, PackagePlan } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { bestMatch, matchCandidateToJob, type MatchJob, type MatchResult } from "../common/matching";
import { effectivePlan, PLANS } from "../common/plans";
import {
  asSections,
  desiredPositions,
  expectedSalaryLabel,
  expectedSalaryRange,
  experienceYears,
  resumeScore,
  skills,
  workplacePreference,
} from "../common/resume";

export interface CandidateSummary {
  id: string;
  code: string;
  name: string;
  avatarUrl: string | null;
  email: string;
  position: string | null;
  skills: string[];
  experienceYears: number;
  /** null = ยังไม่ผ่านขั้น Gate ฝั่ง member จึงยังไม่ประเมิน */
  resumeScore: number | null;
  /** null = บริษัทยังไม่มีประกาศที่ใช้เทียบ */
  matchingScore: number | null;
  matchedJob: { id: string; title: string } | null;
  location: string | null;
  workplacePreference: string | null;
  expectedSalary: string | null;
  registeredAt: string;
  /** สมัครงานของบริษัทนี้ล่าสุดเมื่อไร (null = ยังไม่เคยสมัคร) */
  lastAppliedAt: string | null;
  appliedJobs: Array<{ id: string; title: string }>;
  isApplicant: boolean;
  isPublic: boolean;
  bookmarked: boolean;
  invitations: Array<{ jobId: string; status: InvitationStatus }>;
}

interface PoolCandidate {
  summary: CandidateSummary;
  sections: ReturnType<typeof asSections>;
  profileAddress: string | null;
  hasProfile: boolean;
  match: MatchResult | null;
}

export interface CandidatePool {
  company: Company;
  plan: PackagePlan;
  talentSearch: boolean;
  openJobs: MatchJob[];
  jobsById: Map<string, MatchJob & { status: string }>;
  candidates: PoolCandidate[];
}

/**
 * โหลดผู้หางานพร้อมข้อมูลที่ผูกกับบริษัท (ใบสมัคร ที่บันทึกไว้ คำเชิญ) และคำนวณคะแนนครั้งเดียว
 * ข้อมูลทดลองยังมีไม่มาก จึงคำนวณในหน่วยความจำ – เมื่อผู้ใช้เยอะขึ้นควรย้ายคะแนนไปเก็บเป็นคอลัมน์
 */
@Injectable()
export class CandidatePoolService {
  constructor(private readonly prisma: PrismaService) {}

  async company(companyId: string | null): Promise<Company> {
    if (!companyId) throw new NotFoundException("กรุณากรอกข้อมูลบริษัทก่อน");
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("กรุณากรอกข้อมูลบริษัทก่อน");
    return company;
  }

  toMatchJob(job: { id: string; title: string; skills: string[]; experienceYears: number | null; salaryMin: number; salaryMax: number }): MatchJob {
    return {
      id: job.id,
      title: job.title,
      skills: job.skills,
      experienceYears: job.experienceYears,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    };
  }

  async load(companyId: string | null, onlyIds?: string[]): Promise<CandidatePool> {
    const company = await this.company(companyId);
    const plan = effectivePlan(company);

    const [jobs, users] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId: company.id, deletedAt: null },
        select: { id: true, title: true, skills: true, experienceYears: true, salaryMin: true, salaryMax: true, status: true },
      }),
      this.prisma.user.findMany({
        where: { role: "JOBSEEKER", ...(onlyIds ? { id: { in: onlyIds } } : {}) },
        include: {
          profile: true,
          applications: {
            where: { job: { companyId: company.id, deletedAt: null } },
            select: { jobId: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
          bookmarkedByCompanies: { where: { companyId: company.id }, select: { id: true } },
          invitations: { where: { companyId: company.id }, select: { jobId: true, status: true } },
        },
      }),
    ]);

    const jobsById = new Map(jobs.map((job) => [job.id, { ...this.toMatchJob(job), status: job.status }]));
    const openJobs = jobs.filter((job) => job.status === "PUBLISHED").map((job) => this.toMatchJob(job));

    const candidates = users.map<PoolCandidate>((user) => {
      const sections = asSections(user.profile?.sections);
      const positions = desiredPositions(sections);
      const candidateSkills = skills(sections);
      const years = experienceYears(sections);
      const matchInput = { skills: candidateSkills, positions, experienceYears: years, salary: expectedSalaryRange(sections) };

      // ผู้ที่สมัครงานของบริษัทแล้ว เทียบกับงานที่สมัครล่าสุด ที่เหลือเทียบกับประกาศที่เข้ากันที่สุด
      const latestJob = user.applications[0] ? jobsById.get(user.applications[0].jobId) : undefined;
      const match = latestJob ? matchCandidateToJob(matchInput, latestJob) : bestMatch(matchInput, openJobs);

      const appliedJobs = [...new Set(user.applications.map((application) => application.jobId))]
        .map((id) => jobsById.get(id))
        .filter((job): job is NonNullable<typeof job> => Boolean(job))
        .map((job) => ({ id: job.id, title: job.title }));

      const summary: CandidateSummary = {
        id: user.id,
        code: user.code,
        name: user.name,
        avatarUrl: user.avatarUrl,
        email: user.email,
        position: positions[0] ?? null,
        skills: candidateSkills,
        experienceYears: years,
        resumeScore: user.profile && user.gateCompleted ? resumeScore(sections) : null,
        matchingScore: match?.score ?? null,
        matchedJob: match?.job ?? null,
        location: user.profile?.address ?? null,
        workplacePreference: workplacePreference(sections),
        expectedSalary: expectedSalaryLabel(sections),
        registeredAt: user.createdAt.toISOString(),
        lastAppliedAt: user.applications[0]?.createdAt.toISOString() ?? null,
        appliedJobs,
        isApplicant: user.applications.length > 0,
        isPublic: user.profile?.privacy === "public",
        bookmarked: user.bookmarkedByCompanies.length > 0,
        invitations: user.invitations.map((invitation) => ({ jobId: invitation.jobId, status: invitation.status })),
      };

      return { summary, sections, profileAddress: user.profile?.address ?? null, hasProfile: Boolean(user.profile), match };
    });

    return { company, plan, talentSearch: PLANS[plan].talentSearch, openJobs, jobsById, candidates };
  }

  /**
   * บริษัทเห็นผู้หางานคนหนึ่งได้เมื่อ
   *  - เขาสมัครงานของบริษัท / ได้รับคำเชิญ / ถูกบันทึกไว้แล้ว หรือ
   *  - แพ็กเกจค้นหาทั้งระบบได้ และเขาเปิดโปรไฟล์เป็นสาธารณะ
   */
  canView(pool: CandidatePool, candidate: PoolCandidate): boolean {
    const { summary } = candidate;
    if (summary.isApplicant || summary.invitations.length > 0 || summary.bookmarked) return true;
    return pool.talentSearch && candidate.hasProfile && summary.isPublic;
  }

  find(pool: CandidatePool, candidateId: string): PoolCandidate {
    const candidate = pool.candidates.find((item) => item.summary.id === candidateId);
    if (!candidate || !this.canView(pool, candidate)) throw new NotFoundException("ไม่พบผู้สมัครนี้");
    return candidate;
  }
}

export type { PoolCandidate };
