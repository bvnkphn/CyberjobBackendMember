import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AdminGuard } from "./auth/admin.guard";

import { AdminDashboardController } from "./dashboard/admin-dashboard.controller";
import { AdminDashboardService } from "./dashboard/admin-dashboard.service";
import { AdminCompaniesController } from "./companies/admin-companies.controller";
import { AdminCompaniesService } from "./companies/admin-companies.service";
import { AdminJobsController } from "./jobs/admin-jobs.controller";
import { AdminJobsService } from "./jobs/admin-jobs.service";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { AdminPackagesController } from "./packages/admin-packages.controller";
import { AdminPackagesService } from "./packages/admin-packages.service";
import { AdminSynonymsController } from "./synonyms/admin-synonyms.controller";
import { AdminSynonymsService } from "./synonyms/admin-synonyms.service";
import { AdminSettingsController } from "./settings/admin-settings.controller";
import { AdminSettingsService } from "./settings/admin-settings.service";

@Module({
  imports: [PassportModule],
  controllers: [
    AdminDashboardController,
    AdminCompaniesController,
    AdminJobsController,
    AdminUsersController,
    AdminPackagesController,
    AdminSynonymsController,
    AdminSettingsController,
  ],
  providers: [
    AdminGuard,
    AdminDashboardService,
    AdminCompaniesService,
    AdminJobsService,
    AdminUsersService,
    AdminPackagesService,
    AdminSynonymsService,
    AdminSettingsService,
  ],
  exports: [AdminGuard],
})
export class AdminModule {}
