import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AdminCompaniesService } from "./admin-companies.service";

@Controller("admin/companies")
@UseGuards(AdminGuard)
export class AdminCompaniesController {
  constructor(private readonly companies: AdminCompaniesService) {}

  @Get()
  list(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 20,
  ) {
    return this.companies.list(status, search, Number(page), Number(pageSize));
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.companies.detail(id);
  }

  @Patch(":id/verify")
  verify(
    @Param("id") id: string,
    @Body() body: { action: "APPROVED" | "REJECTED"; notes?: string },
  ) {
    return this.companies.verify(id, body.action, body.notes);
  }
}
