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
  ],
  controllers: [HealthController],
})
export class AppModule {}
