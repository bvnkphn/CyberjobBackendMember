import { Injectable, NotFoundException } from '@nestjs/common';
import type { Company, Job, JobQuery, Paginated } from '@cyberjob/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toCompanyDto } from '../common/mappers';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  async list(): Promise<Company[]> {
    // บริษัทที่ตั้งค่าเป็นส่วนตัวไม่แสดงในรายชื่อและหน้าบริษัท
    const rows = await this.prisma.company.findMany({
      where: { isPublic: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(toCompanyDto);
  }

  async findOne(slugOrId: string): Promise<Company> {
    const row = await this.prisma.company.findFirst({
      where: { isPublic: true, OR: [{ slug: slugOrId }, { id: slugOrId }] },
    });
    if (!row) throw new NotFoundException(`ไม่พบบริษัท: ${slugOrId}`);
    return toCompanyDto(row);
  }

  /** จำนวนงานที่เปิดรับ – ใช้แสดงบนแท็บ "งาน (n)" */
  async jobCount(slug: string): Promise<number> {
    return this.prisma.job.count({
      where: { isActive: true, company: { slug } },
    });
  }

  /** งานทั้งหมดของบริษัทนั้น */
  async jobsOf(slugOrId: string, query: JobQuery = {}): Promise<Paginated<Job>> {
    const company = await this.findOne(slugOrId);
    return this.jobs.search({ ...query, companySlug: company.slug });
  }
}
