import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { DashboardService } from "./dashboard.service";

@Controller("owner")
@UseGuards(OwnerGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("dashboard")
  overview(@CurrentOwner() owner: OwnerContext) {
    return this.dashboard.overview(owner.companyId);
  }

  @Get("notifications")
  notifications(@CurrentOwner() owner: OwnerContext) {
    return this.dashboard.notifications(owner.companyId);
  }
}
