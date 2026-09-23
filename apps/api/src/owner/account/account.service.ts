import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { OwnerContext } from "../auth/owner.guard";
import { CompanyService } from "../company/company.service";
import { effectivePlan, PLANS } from "../common/plans";
import type { ChangePasswordDto, DeleteAccountDto } from "./dto";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompanyService,
  ) {}

  /** ข้อมูลตั้งต้นของหลังบ้าน – หน้าเว็บใช้ตัดสินว่าต้องไปหน้า Gate หรือไม่ */
  async me(owner: OwnerContext) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: owner.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, provider: true, passwordHash: true },
    });
    const company = owner.companyId ? await this.prisma.company.findUnique({ where: { id: owner.companyId } }) : null;
    const plan = company ? effectivePlan(company) : "FREE";
    const pendingPayment = company
      ? await this.prisma.subscriptionPayment.findFirst({
          where: { companyId: company.id, status: "PENDING" },
          select: { id: true, plan: true, amount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        hasPassword: Boolean(user.passwordHash),
      },
      company: company ? this.companies.toProfile(company) : null,
      plan: {
        current: plan,
        expiresAt: company?.plan !== "FREE" ? (company?.planExpiresAt?.toISOString() ?? null) : null,
        talentSearch: PLANS[plan].talentSearch,
        pendingPayment: pendingPayment
          ? { ...pendingPayment, createdAt: pendingPayment.createdAt.toISOString() }
          : null,
      },
    };
  }

  private async verifyPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
    if (!user.passwordHash) {
      throw new BadRequestException("บัญชีนี้เข้าสู่ระบบด้วย Google จึงไม่มีรหัสผ่าน");
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    }
  }

  /**
   * เปลี่ยนรหัสผ่าน (Feature 7.2)
   * เพิกถอน refresh token ทุกอุปกรณ์ด้วย – ถ้ารหัสเดิมหลุดไป คนที่ล็อกอินค้างไว้จะถูกออกจากระบบ
   */
  async changePassword(owner: OwnerContext, dto: ChangePasswordDto) {
    await this.verifyPassword(owner.userId, dto.currentPassword);
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: owner.userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: owner.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { ok: true, reloginRequired: true };
  }

  /**
   * ลบบัญชี – ปิดประกาศทั้งหมดและซ่อนบริษัทจากหน้าเว็บ แล้วลบผู้ใช้
   * แถวบริษัท ใบสมัคร และคำตอบยังเก็บไว้ ไม่ให้ประวัติของผู้หางานหายไปด้วย
   */
  async deleteAccount(owner: OwnerContext, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: owner.userId }, select: { passwordHash: true } });
    if (user.passwordHash) {
      if (!dto.currentPassword) throw new BadRequestException("กรุณากรอกรหัสผ่านปัจจุบัน");
      await this.verifyPassword(owner.userId, dto.currentPassword);
    }

    await this.prisma.$transaction(async (tx) => {
      if (owner.companyId) {
        await tx.job.updateMany({
          where: { companyId: owner.companyId, status: "PUBLISHED" },
          data: { status: "CLOSED", isActive: false },
        });
        await tx.company.update({ where: { id: owner.companyId }, data: { ownerId: null, isPublic: false } });
      }
      await tx.user.delete({ where: { id: owner.userId } });
    });
    return { ok: true };
  }
}
