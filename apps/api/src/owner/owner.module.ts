import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AccountController } from './account/account.controller';
import { AccountService } from './account/account.service';
import { OwnerGuard } from './auth/owner.guard';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';
import { CandidatePoolService } from './candidates/candidate-pool.service';
import { CandidatesController } from './candidates/candidates.controller';
import { CandidatesService } from './candidates/candidates.service';
import { CompanyController } from './company/company.controller';
import { CompanyService } from './company/company.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { OwnerJobsController } from './jobs/owner-jobs.controller';
import { OwnerJobsService } from './jobs/owner-jobs.service';
import { SupportController, SupportService } from './support/support';

@Module({
  imports: [PassportModule],
  controllers: [
    AccountController,
    CompanyController,
    OwnerJobsController,
    CandidatesController,
    DashboardController,
    BillingController,
    SupportController,
  ],
  providers: [
    OwnerGuard,
    AccountService,
    CompanyService,
    OwnerJobsService,
    CandidatePoolService,
    CandidatesService,
    DashboardService,
    BillingService,
    SupportService,
  ],
  exports: [OwnerGuard],
})
export class OwnerModule {}
