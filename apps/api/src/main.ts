import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { publicUploadDir } from './owner/common/files';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Hostinger ตรวจ root path ระหว่างเริ่ม process จึงต้องตอบ 200 โดยไม่ผ่าน API prefix
  app.getHttpAdapter().get('/', (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json({
      status: 'ok',
      service: 'cyberjob-backend',
      api: '/api',
    });
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // เสิร์ฟรูปภาพ public ของผู้ประกอบการ (โลโก้ รูปปก แกลเลอรี)
  app.useStaticAssets(publicUploadDir(), {
    prefix: '/uploads/public/',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res: any) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  // ต้องเปิด credentials เพื่อให้เบราว์เซอร์ส่ง refresh cookie มาด้วย
  // ไม่ตั้ง WEB_ORIGIN → จำกัดไว้ที่ localhost เท่านั้น (ไม่สะท้อน origin ใดก็ได้)
  const origins = process.env.WEB_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins?.length ? origins : ['http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`CyberJob API พร้อมใช้งานที่ http://localhost:${port}/api`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    `เริ่ม CyberJob API ไม่สำเร็จ: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
