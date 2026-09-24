import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { JobsModule } from './jobs/jobs.module';
import { MeModule } from './me/me.module';
import { MetaModule } from './meta/meta.module';
import { SupportModule } from './support/support.module';
import { HealthController } from './health.controller';
import { GateModule } from './gate/gate.module';
import { OwnerModule } from './owner/owner.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    JobsModule,
    CompaniesModule,
    MeModule,
    MetaModule,
    SupportModule,
    GateModule,
    OwnerModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
