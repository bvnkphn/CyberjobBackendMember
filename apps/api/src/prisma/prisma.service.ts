import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }
    const adapter = new PrismaPg({ connectionString });
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('เชื่อมต่อ PostgreSQL สำเร็จ');
    } catch (error) {
      // ให้ API และ /api/health เริ่มทำงานได้เพื่อรายงานสถานะ แม้ฐานข้อมูล
      // จะติดต่อไม่ได้ชั่วคราว Prisma จะลองเชื่อมต่อใหม่เมื่อมี query แรก
      this.logger.error(
        `ยังเชื่อมต่อ PostgreSQL ไม่สำเร็จตอนเริ่มระบบ: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
