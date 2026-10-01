import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * สร้างรหัส OTP 6 หลัก และส่งไปยังอีเมล
   */
  async generateOtp(email: string, type = 'LOGIN_2FA'): Promise<{ ok: boolean; message: string; cooldownSeconds?: number }> {
    const normalizedEmail = email.trim().toLowerCase();

    // ตรวจสอบ cooldown เพื่อป้องกัน spam
    const latestOtp = await this.prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        type,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const elapsed = Date.now() - latestOtp.createdAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS && !latestOtp.usedAt) {
        const remaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new BadRequestException(`กรุณารออีก ${remaining} วินาทีก่อนขอรหัสใหม่อีกครั้ง`);
      }
    }

    // สร้างรหัส OTP 6 หลักด้วย Cryptographically Secure Pseudo-Random Generator (CSPRNG)
    const crypto = await import('crypto');
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    // บันทึกลงฐานข้อมูล
    await this.prisma.otpCode.create({
      data: {
        email: normalizedEmail,
        code,
        type,
        expiresAt,
      },
    });

    // ส่งอีเมล OTP
    await this.mail.sendOtpEmail(normalizedEmail, code, type);

    this.logger.log(`Generated OTP for ${normalizedEmail} [${type}]`);
    return { ok: true, message: 'ส่งรหัส OTP ไปยังอีเมลเรียบร้อยแล้ว' };
  }

  /**
   * ตรวจสอบความถูกต้องของรหัส OTP
   */
  async verifyOtp(email: string, code: string, type = 'LOGIN_2FA'): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        type,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('ไม่พบรหัส OTP หรือรหัสถูกใช้งานไปแล้ว');
    }

    // ตรวจสอบจำนวนครั้งที่ลองผิด
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      throw new UnauthorizedException('กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่');
    }

    // ตรวจสอบเวลาหมดอายุ
    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่');
    }

    // ตรวจสอบรหัส
    if (otpRecord.code !== trimmedCode) {
      // เพิ่มจำนวนครั้งที่ลองผิด
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      throw new UnauthorizedException(
        remainingAttempts > 0
          ? `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสอีก ${remainingAttempts} ครั้ง)`
          : 'รหัส OTP ไม่ถูกต้อง และถูกระงับเนื่องจากกรอกผิดเกินกำหนด',
      );
    }

    // ถูกต้อง: ทำเครื่องหมายว่าใช้งานแล้ว
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(`Verified OTP successfully for ${normalizedEmail} [${type}]`);
    return true;
  }
}
