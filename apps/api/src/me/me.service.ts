import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueViolation } from '../common/prisma-errors';
import type { Job, JobApplication } from '@cyberjob/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toJobDto } from '../common/mappers';

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
    const job = await this.prisma.job.findFirst({ where: { id: jobId, deletedAt: null } });
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
        where: { id: { in: jobIds }, deletedAt: null },
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
      include: { job: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      job: toJobDto(row.job),
      status: row.status,
      coverLetter: row.coverLetter ?? undefined,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async apply(
    userId: string,
    jobId: string,
    coverLetter?: string,
  ): Promise<JobApplication> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
      include: { company: true },
    });
    if (!job) throw new NotFoundException('ไม่พบประกาศงานนี้');

    // ให้ฐานข้อมูลเป็นคนตัดสินว่าซ้ำหรือไม่ (กันกรณีกดสมัครรัว ๆ พร้อมกัน)
    let row;
    try {
      row = await this.prisma.application.create({
        data: { userId, jobId, coverLetter: coverLetter ?? null },
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
      createdAt: row.createdAt.toISOString(),
    };
  }
}
