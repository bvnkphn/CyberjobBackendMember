import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { QueryJobsDto, SaveJobDto } from "./dto";
import { OwnerJobsService } from "./owner-jobs.service";

@Controller("owner/jobs")
@UseGuards(OwnerGuard)
export class OwnerJobsController {
  constructor(private readonly jobs: OwnerJobsService) {}

  @Get()
  list(@CurrentOwner() owner: OwnerContext, @Query() query: QueryJobsDto) {
    return this.jobs.list(owner.companyId, query);
  }

  @Get(":id")
  detail(@CurrentOwner() owner: OwnerContext, @Param("id") id: string) {
    return this.jobs.detail(owner.companyId, id);
  }

  @Post()
  create(@CurrentOwner() owner: OwnerContext, @Body() dto: SaveJobDto) {
    return this.jobs.create(owner.companyId, dto);
  }

  @Put(":id")
  update(@CurrentOwner() owner: OwnerContext, @Param("id") id: string, @Body() dto: SaveJobDto) {
    return this.jobs.update(owner.companyId, id, dto);
  }

  @Post(":id/close")
  @HttpCode(200)
  close(@CurrentOwner() owner: OwnerContext, @Param("id") id: string) {
    return this.jobs.close(owner.companyId, id);
  }

  @Post(":id/publish")
  @HttpCode(200)
  publish(@CurrentOwner() owner: OwnerContext, @Param("id") id: string) {
    return this.jobs.publish(owner.companyId, id);
  }

  @Delete(":id")
  remove(@CurrentOwner() owner: OwnerContext, @Param("id") id: string) {
    return this.jobs.remove(owner.companyId, id);
  }
}
