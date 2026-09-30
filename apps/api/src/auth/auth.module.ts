import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailService } from './mail.service';
import { OtpService } from './otp.service';

/** token สำหรับ provider ของ Google strategy */
const GOOGLE_STRATEGY = Symbol('GOOGLE_STRATEGY');

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TTL') ?? '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MailService,
    OtpService,
    JwtStrategy,
    {
      /**
       * สร้าง Google strategy ผ่าน factory เพื่อให้อ่านค่าจาก ConfigService
       * (ถ้าเช็ค process.env ตอน import module จะยังไม่มีค่าจากไฟล์ .env)
       * ยังไม่ตั้งค่า → คืน null แล้ว GoogleAuthGuard จะตอบ 501 พร้อมคำอธิบาย
       */
      provide: GOOGLE_STRATEGY,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('GOOGLE_CLIENT_ID') &&
        config.get<string>('GOOGLE_CLIENT_SECRET')
          ? new GoogleStrategy(config)
          : null,
    },
  ],
  exports: [AuthService, MailService, OtpService],
})
export class AuthModule {}

