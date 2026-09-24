import { Body, Controller, Delete, Get, Header, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AdminGuard } from "../auth/admin.guard";
import type { RequestUser } from "../../auth/auth.types";
import { AdminUsersService } from "./admin-users.service";
import { QueryUsersDto, UpdateUserDto } from "./dto/users.dto";

/** Feature 3 จัดการผู้ใช้ (ไม่รวม "เพิ่มผู้สมัคร" ซึ่งอยู่นอกขอบเขต) */
@Controller(["admin/users", "v1/admin/users"])
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() query: QueryUsersDto) {
    return this.users.list(query);
  }

  @Get("stats")
  stats() {
    return this.users.stats();
  }

  // ต้องประกาศก่อน ":id" ไม่งั้น "export.csv" จะถูกตีความเป็น id
  @Get("export.csv")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="cyberjob-candidates.csv"')
  exportCsv(@Query() query: QueryUsersDto) {
    return this.users.exportCsv(query);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.users.detail(id);
  }

  @Get(":id/resume")
  resume(@Param("id") id: string) {
    return this.users.resume(id);
  }

  @Get(":id/certificates")
  certificates(@Param("id") id: string) {
    return this.users.certificates(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.users.updateSource(id, dto.candidateSource);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: Request & { user: RequestUser }) {
    return this.users.remove(id, request.user.id);
  }
}
