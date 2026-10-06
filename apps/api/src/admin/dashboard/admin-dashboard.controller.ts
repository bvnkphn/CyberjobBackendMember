import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AdminDashboardService } from "./admin-dashboard.service";

@Controller("admin/dashboard")
@UseGuards(AdminGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get("stats")
  stats() {
    return this.dashboard.getStats();
  }
}
