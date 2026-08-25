import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Company, Job, Paginated } from '@cyberjob/shared';
import { QueryJobsDto } from '../jobs/dto/query-jobs.dto';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  /** GET /api/companies */
  @Get()
  list(): Promise<Company[]> {
    return this.companies.list();
  }

  /** GET /api/companies/:slug – โปรไฟล์บริษัท พร้อมจำนวนงานที่เปิดรับ */
  @Get(':slug')
  async findOne(
    @Param('slug') slug: string,
  ): Promise<Company & { jobCount: number }> {
    const company = await this.companies.findOne(slug);
    const jobCount = await this.companies.jobCount(company.slug);
    return { ...company, jobCount };
  }

  /** GET /api/companies/:slug/jobs – งานทั้งหมดของบริษัท */
  @Get(':slug/jobs')
  jobs(
    @Param('slug') slug: string,
    @Query() query: QueryJobsDto,
  ): Promise<Paginated<Job>> {
    return this.companies.jobsOf(slug, query);
  }
}
