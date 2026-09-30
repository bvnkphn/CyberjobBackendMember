import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, UserRole, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type { AuthResult, AuthUser } from '@cyberjob/shared';
import { PrismaService } from '../prisma/prisma.service';
import { isUniqueViolation } from '../common/prisma-errors';
import { RegisterDto, RegistrationRole } from './dto/auth.dto';
import type { JwtPayload, OAuthProfile } from './auth.types';
import { OtpService } from './otp.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  /* ---------------------------------------------------------------- */
  /* helper                                                            */
  /* ---------------------------------------------------------------- */

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? undefined,
      role: user.role,
      provider: user.provider,
      gateCompleted: user.gateCompleted,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private accessTtl(): string {
    return this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
  }

  private refreshTtlDays(): number {
    return Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS') ?? 30);
  }

  /** แปลง '15m' / '2h' / '30s' เป็นวินาที เพื่อบอก frontend ว่า token หมดอายุเมื่อไร */
  private accessTtlSeconds(): number {
    const raw = this.accessTtl();
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2];
    const factor = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    return value * factor;
  }

  private signAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.accessTtl(),
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * ออก refresh token ใหม่และเก็บเฉพาะ hash ไว้ในฐานข้อมูล
   * ทำให้เพิกถอน (logout) ได้จริง ไม่ใช่แค่รอหมดอายุ
   */
  private async issueRefreshToken(
    user: User,
    userAgent?: string,
  ): Promise<string> {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTtlDays());

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(token),
        userId: user.id,
        expiresAt,
        userAgent: userAgent?.slice(0, 255) ?? null,
      },
    });

    return token;
  }

  private async buildResult(
    user: User,
    userAgent?: string,
  ): Promise<{ result: AuthResult; refreshToken: string }> {
    const refreshToken = await this.issueRefreshToken(user, userAgent);
    return {
      refreshToken,
      result: {
        user: this.toAuthUser(user),
        accessToken: this.signAccessToken(user),
        expiresIn: this.accessTtlSeconds(),
      },
    };
  }

  /* ---------------------------------------------------------------- */
  /* สมัครสมาชิก / เข้าสู่ระบบ                                          */
  /* ---------------------------------------------------------------- */

  async register(dto: RegisterDto, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();

    // ให้ unique constraint ของฐานข้อมูลเป็นตัวตัดสิน กันสมัครซ้ำพร้อมกัน
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
          role: dto.role,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
      }
      throw error;
    }

    return this.buildResult(user, userAgent);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    if (local.length <= 2) {
      return `${local[0]}*@${domain}`;
    }
    const visiblePrefix = local.slice(0, 2);
    return `${visiblePrefix}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
  }

  async login(email: string, password: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // ข้อความเดียวกันทั้งกรณีไม่มีผู้ใช้และรหัสผ่านผิด เพื่อไม่ให้เดาอีเมลได้
    const invalid = new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    if (!user || !user.passwordHash) throw invalid;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw invalid;

    // สำหรับผู้ดูแลระบบ (ADMIN) อนุญาตให้ออกสิทธิ์เข้าใช้งานหลังบ้านได้ทันที
    if (user.role === UserRole.ADMIN) {
      return this.buildResult(user, userAgent);
    }

    // สำหรับ Member (JOBSEEKER) และ Owner (EMPLOYER) ส่งรหัส OTP ยืนยันตัวตน 2FA
    await this.otpService.generateOtp(user.email, 'LOGIN_2FA');

    return {
      requireOtp: true,
      email: user.email,
      maskedEmail: this.maskEmail(user.email),
      message: 'กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังอีเมลของคุณ',
    };
  }

  async verifyLoginOtp(email: string, code: string, userAgent?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('ไม่พบบัญชีผู้ใช้');
    }

    // ตรวจสอบ OTP
    await this.otpService.verifyOtp(normalizedEmail, code, 'LOGIN_2FA');

    // ยืนยันสำเร็จ ออก token
    return this.buildResult(user, userAgent);
  }

  async resendLoginOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('ไม่พบบัญชีผู้ใช้');
    }

    return this.otpService.generateOtp(normalizedEmail, 'LOGIN_2FA');
  }

  async loginWithGoogleToken(idToken: string, requestedRole?: RegistrationRole, userAgent?: string) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: clientId || undefined,
      });
    } catch (err) {
      throw new UnauthorizedException(
        `การตรวจสอบสิทธิ์ Google ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('ข้อมูลจากบัญชี Google ไม่ถูกต้องหรือไม่พบอีเมล');
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const avatarUrl = payload.picture || null;
    const providerId = payload.sub;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { provider: AuthProvider.GOOGLE, providerId },
          { email },
        ],
      },
    });

    if (!user) {
      const role = requestedRole === 'EMPLOYER' ? UserRole.EMPLOYER : UserRole.JOBSEEKER;
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          provider: AuthProvider.GOOGLE,
          providerId,
          role,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: AuthProvider.GOOGLE,
          providerId,
          avatarUrl: user.avatarUrl ?? avatarUrl,
        },
      });
    }

    return this.buildResult(user, userAgent);
  }


  /* ---------------------------------------------------------------- */
  /* OAuth 2.0                                                         */
  /* ---------------------------------------------------------------- */

  /** สร้างหรือเชื่อมบัญชีจากผู้ให้บริการภายนอก แล้วออก token ให้ */
  async loginWithOAuth(profile: OAuthProfile, userAgent?: string) {
    const email = profile.email.trim().toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { provider: profile.provider, providerId: profile.providerId },
          { email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name,
          avatarUrl: profile.avatarUrl ?? null,
          provider: profile.provider,
          providerId: profile.providerId,
        },
      });
    } else if (!user.providerId) {
      // มีบัญชีอีเมลเดิมอยู่แล้ว – ผูกเข้ากับบัญชี Google
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: profile.provider,
          providerId: profile.providerId,
          avatarUrl: user.avatarUrl ?? profile.avatarUrl ?? null,
        },
      });
    }

    return this.buildResult(user, userAgent);
  }

  /* ---------------------------------------------------------------- */
  /* refresh / logout                                                  */
  /* ---------------------------------------------------------------- */

  /** ต่ออายุ access token และหมุน refresh token ทุกครั้ง (rotation) */
  async refresh(token: string | undefined, userAgent?: string) {
    if (!token) throw new UnauthorizedException('ไม่พบ refresh token');

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('refresh token ไม่ถูกต้องหรือหมดอายุแล้ว');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.buildResult(record.user, userAgent);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** เพิกถอนทุก session ของผู้ใช้ */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('ไม่พบผู้ใช้');
    return this.toAuthUser(user);
  }
}
