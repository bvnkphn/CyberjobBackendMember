import { Controller, Delete, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AdminJobsService } from "./admin-jobs.service";
import { QueryJobsDto } from "./dto/query-jobs.dto";

/** Feature 5 จัดการการประกาศงาน – ดูได้ทั้งหมด ลบได้ ไม่มีการแก้ไข (ชีตขีดออก) */
@Controller(["admin/jobs", "v1/admin/jobs"])
@UseGuards(AdminGuard)
export class AdminJobsController {
  constructor(private readonly jobs: AdminJobsService) {}

  @Get()
  list(@Query() query: QueryJobsDto) {
    return this.jobs.list(query);
  }

  @Get("filters")
  filters() {
    return this.jobs.filterOptions();
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.jobs.softDelete(id);
  }
}
