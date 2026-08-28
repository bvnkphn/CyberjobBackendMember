import { Controller, Get, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'cyberjob-backend-member',
      timestamp: new Date().toISOString(),
    };
  }

  /** ตรวจฐานข้อมูลโดยไม่เปิดเผย connection string หรือข้อมูลผู้ใช้ */
  @Get('database')
  async database() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      const code =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : error instanceof Prisma.PrismaClientInitializationError
            ? error.errorCode ?? 'INITIALIZATION_ERROR'
            : 'DATABASE_ERROR';
      this.logger.error(`Database health check failed (${code})`);
      return { status: 'error', database: 'unavailable', code };
    }
  }
}
