import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Job, Paginated, Suggestion } from '@cyberjob/shared';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  /** GET /api/jobs – ค้นหา + กรอง + เรียง + แบ่งหน้า */
  @Get()
  search(@Query() query: QueryJobsDto): Promise<Paginated<Job>> {
    return this.jobs.search(query);
  }

  /** GET /api/jobs/suggest?q=fr – Search Auto (Feature 3.1) */
  @Get('suggest')
  suggest(
    @Query('q') q = '',
    @Query('limit') limit?: string,
  ): Promise<Suggestion[]> {
    return this.jobs.suggest(q, limit ? Number(limit) : 8);
  }

  /** GET /api/jobs/recommended – ตำแหน่งงานแนะนำหน้าแรก */
  @Get('recommended')
  recommended(@Query('limit') limit?: string): Promise<Job[]> {
    return this.jobs.recommended(limit ? Number(limit) : 3);
  }

  /** GET /api/jobs/bookmarks?ids=... – เติมข้อมูลงานที่บันทึกไว้ (Feature 7.1) */
  @Get('bookmarks')
  bookmarks(@Query('ids') ids = ''): Promise<Job[]> {
    const list = ids.split(',').map((s) => s.trim()).filter(Boolean);
    return this.jobs.findMany(list);
  }

  /** GET /api/jobs/:idOrSlug – รายละเอียดงานเต็ม (Feature 3.3) */
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string): Promise<Job> {
    return this.jobs.findOne(idOrSlug);
  }

  /** GET /api/jobs/:idOrSlug/related – งานที่แนะนำ */
  @Get(':idOrSlug/related')
  related(
    @Param('idOrSlug') idOrSlug: string,
    @Query('limit') limit?: string,
  ): Promise<Job[]> {
    return this.jobs.related(idOrSlug, limit ? Number(limit) : 2);
  }
}
