import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import type { AuthResult, AuthUser } from '@cyberjob/shared';
import { PrismaService } from '../prisma/prisma.service';
import { isUniqueViolation } from '../common/prisma-errors';
import { RegisterDto } from './dto/auth.dto';
import type { JwtPayload, OAuthProfile } from './auth.types';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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

  async login(email: string, password: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // ข้อความเดียวกันทั้งกรณีไม่มีผู้ใช้และรหัสผ่านผิด เพื่อไม่ให้เดาอีเมลได้
    const invalid = new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    if (!user || !user.passwordHash) throw invalid;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw invalid;

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
