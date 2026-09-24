import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AdminJobsController } from "./jobs/admin-jobs.controller";
import { AdminJobsService } from "./jobs/admin-jobs.service";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { AdminGuard } from "./auth/admin.guard";

@Module({
  imports: [PassportModule],
  controllers: [AdminJobsController, AdminUsersController],
  providers: [AdminJobsService, AdminUsersService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
