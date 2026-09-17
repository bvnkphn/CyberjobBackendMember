import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ApplicationAnswer, Invitation, JobQuestion, Prisma } from '@prisma/client';
import { isUniqueViolation } from '../common/prisma-errors';
import type { Job, JobApplication, MemberInvitation } from '@cyberjob/shared';
import { PrismaService } from '../prisma/prisma.service';
import { QUESTION_TYPE_TO_API, toJobDto } from '../common/mappers';

const SHORT_ANSWER_MAX = 300;
const LONG_ANSWER_MAX = 4000;

function toAnswerDto(row: ApplicationAnswer): NonNullable<JobApplication['answers']>[number] {
  return {
    questionId: row.questionId,
    question: row.questionText,
    type: QUESTION_TYPE_TO_API[row.questionType],
    answer: row.answer as string | string[],
  };
}

const INVITATION_STATUS_TO_API = {
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------- งานที่บันทึกไว้ (Feature 7.1) ---------------- */

  async bookmarks(userId: string): Promise<Job[]> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId, job: { isActive: true } },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toJobDto(row.job));
  }

  async addBookmark(userId: string, jobId: string): Promise<{ ok: true }> {
    // ประกาศที่ผู้ดูแลระบบลบแล้ว (soft delete) ยังมีแถวอยู่ ต้องถือว่าไม่มีงานนี้
    // ประกาศที่ถูกลบ (soft delete) ยังเป็นร่าง หรือปิดรับสมัครแล้ว ต้องถือว่าไม่มีงานนี้
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null, isActive: true },
    });
    if (!job) throw new NotFoundException('ไม่พบประกาศงานนี้');

    await this.prisma.bookmark.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {},
      create: { userId, jobId },
    });
    return { ok: true };
  }

  async removeBookmark(userId: string, jobId: string): Promise<{ ok: true }> {
    await this.prisma.bookmark.deleteMany({ where: { userId, jobId } });
    return { ok: true };
  }

  /**
   * รวมงานที่เคยบันทึกไว้ในเครื่อง (ตอนยังไม่ล็อกอิน) เข้ากับบัญชี
   * เรียกครั้งเดียวหลังล็อกอินสำเร็จ
   */
  async syncBookmarks(userId: string, jobIds: string[]): Promise<Job[]> {
    if (jobIds.length) {
      const existing = await this.prisma.job.findMany({
        where: { id: { in: jobIds }, deletedAt: null, isActive: true },
        select: { id: true },
      });

      await this.prisma.bookmark.createMany({
        data: existing.map((job) => ({ userId, jobId: job.id })),
        skipDuplicates: true,
      });
    }
    return this.bookmarks(userId);
  }

  /* ---------------- การสมัครงาน ---------------- */

  async applications(userId: string): Promise<JobApplication[]> {
    const rows = await this.prisma.application.findMany({
      where: { userId },
      include: {
        job: { include: { company: true } },
        answers: { orderBy: { position: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      job: toJobDto(row.job),
      status: row.status,
      coverLetter: row.coverLetter ?? undefined,
      answers: row.answers.map(toAnswerDto),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async apply(
    userId: string,
    jobId: string,
    coverLetter?: string,
    answers: Array<{ questionId: string; answer: unknown }> = [],
  ): Promise<JobApplication> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null, isActive: true },
      include: { company: true, questions: { orderBy: { position: 'asc' } } },
    });
    if (!job) throw new NotFoundException('ไม่พบประกาศงานนี้');

    const answerRows = this.validateAnswers(job.questions, answers);

    // ให้ฐานข้อมูลเป็นคนตัดสินว่าซ้ำหรือไม่ (กันกรณีกดสมัครรัว ๆ พร้อมกัน)
    let row;
    try {
      row = await this.prisma.application.create({
        data: {
          userId,
          jobId,
          coverLetter: coverLetter ?? null,
          answers: { create: answerRows },
        },
        include: { answers: { orderBy: { position: 'asc' } } },
      });
      // สมัครตามคำเชิญแล้ว ถือว่าตอบรับคำเชิญของงานนี้
      await this.prisma.invitation.updateMany({
        where: { candidateId: userId, jobId, status: 'SENT' },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('คุณสมัครงานนี้ไปแล้ว');
      }
      throw error;
    }

    return {
      id: row.id,
      job: toJobDto(job),
      status: row.status,
      coverLetter: row.coverLetter ?? undefined,
      answers: row.answers.map(toAnswerDto),
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * ตรวจคำตอบให้ตรงกับคำถามของประกาศ แล้วแปลงเป็นแถวที่จะบันทึก
   * เก็บข้อความคำถามไว้ด้วย เผื่อผู้ประกอบการแก้คำถามภายหลัง
   */
  private validateAnswers(
    questions: JobQuestion[],
    answers: Array<{ questionId: string; answer: unknown }>,
  ): Prisma.ApplicationAnswerCreateWithoutApplicationInput[] {
    const byId = new Map(questions.map((question) => [question.id, question]));
    const given = new Map<string, unknown>();
    for (const item of answers) {
      if (!byId.has(item.questionId)) {
        throw new BadRequestException('มีคำตอบของคำถามที่ไม่อยู่ในประกาศงานนี้');
      }
      given.set(item.questionId, item.answer);
    }

    const rows: Prisma.ApplicationAnswerCreateWithoutApplicationInput[] = [];
    for (const question of questions) {
      const raw = given.get(question.id);
      const value = this.normaliseAnswer(question, raw);
      if (value === null) {
        if (question.required) {
          throw new BadRequestException(`กรุณาตอบคำถาม: ${question.text}`);
        }
        continue;
      }
      rows.push({
        question: { connect: { id: question.id } },
        questionText: question.text,
        questionType: question.type,
        answer: value,
        position: question.position,
      });
    }
    return rows;
  }

  /** คืน null เมื่อไม่ได้ตอบ – โยน 400 เมื่อรูปแบบคำตอบไม่ถูกต้อง */
  private normaliseAnswer(question: JobQuestion, raw: unknown): string | string[] | null {
    const invalid = () => new BadRequestException(`คำตอบไม่ถูกต้อง: ${question.text}`);

    if (question.type === 'MULTI') {
      if (raw === undefined || raw === null) return null;
      if (!Array.isArray(raw) || raw.some((item) => typeof item !== 'string')) throw invalid();
      const picked = [...new Set(raw as string[])];
      if (picked.some((item) => !question.options.includes(item))) throw invalid();
      return picked.length ? picked : null;
    }

    if (raw === undefined || raw === null) return null;
    if (typeof raw !== 'string') throw invalid();
    const value = raw.trim();
    if (!value) return null;

    switch (question.type) {
      case 'SINGLE':
        if (!question.options.includes(value)) throw invalid();
        return value;
      case 'DATE':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) throw invalid();
        return value;
      case 'SHORT':
        if (value.length > SHORT_ANSWER_MAX) throw invalid();
        return value;
      default:
        if (value.length > LONG_ANSWER_MAX) throw invalid();
        return value;
    }
  }

  /* ---------------- คำเชิญจากบริษัท (Owner Feature 2.5) ---------------- */

  private toInvitationDto(
    row: Invitation & { job: Parameters<typeof toJobDto>[0] },
  ): MemberInvitation {
    return {
      id: row.id,
      status: INVITATION_STATUS_TO_API[row.status],
      message: row.message ?? undefined,
      job: toJobDto(row.job),
      createdAt: row.createdAt.toISOString(),
      respondedAt: row.respondedAt?.toISOString(),
    };
  }

  async invitations(userId: string): Promise<MemberInvitation[]> {
    const rows = await this.prisma.invitation.findMany({
      where: { candidateId: userId, job: { deletedAt: null } },
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toInvitationDto(row));
  }

  async respondInvitation(
    userId: string,
    id: string,
    status: 'accepted' | 'declined',
  ): Promise<MemberInvitation> {
    const updated = await this.prisma.invitation.updateMany({
      where: { id, candidateId: userId, status: 'SENT' },
      data: { status: status === 'accepted' ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() },
    });
    const row = await this.prisma.invitation.findFirst({
      where: { id, candidateId: userId },
      include: { job: { include: { company: true } } },
    });
    if (!row) throw new NotFoundException('ไม่พบคำเชิญนี้');
    if (updated.count === 0) throw new ConflictException('ตอบคำเชิญนี้ไปแล้ว');
    return this.toInvitationDto(row);
  }
}
