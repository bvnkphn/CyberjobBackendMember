import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { PlanEnum, QuerySubscribersDto, ReviewPaymentDto, UpdateSubscriberDto, UpsertTierDto } from "./dto/packages.dto";

const DEFAULT_TIERS = [
  {
    plan: "FREE" as const,
    name: "Standard Free",
    price: 0,
    billingCycle: "forever",
    quotaJobs: 3,
    highlightJobs: 0,
    candidateViews: 10,
    aiMatching: false,
    inviteCandidates: false,
    dedicatedSupport: false,
    popular: false,
    sortOrder: 0,
    features: ["ลงประกาศงานได้ 3 ตำแหน่ง", "ระบบคัดกรองเบื้องต้น", "รับใบสมัครไม่จำกัด"],
  },
  {
    plan: "GOLD" as const,
    name: "Professional Gold",
    price: 4900,
    billingCycle: "month",
    quotaJobs: 15,
    highlightJobs: 5,
    candidateViews: 100,
    aiMatching: true,
    inviteCandidates: false,
    dedicatedSupport: false,
    popular: true,
    sortOrder: 1,
    features: [
      "ลงประกาศงานได้ 15 ตำแหน่ง",
      "ดันประกาศงานหน้าแรก (Hot Job) 5 ตำแหน่ง",
      "ดูโปรไฟล์ผู้สมัครเชิงลึก 100 คน",
      "ระบบ AI แนะนำผู้สมัครที่ตรงทักษะ",
    ],
  },
  {
    plan: "PLATINUM" as const,
    name: "Enterprise Platinum",
    price: 12900,
    billingCycle: "month",
    quotaJobs: 50,
    highlightJobs: 20,
    candidateViews: 500,
    aiMatching: true,
    inviteCandidates: true,
    dedicatedSupport: true,
    popular: false,
    sortOrder: 2,
    features: [
      "ลงประกาศงานได้ 50+ ตำแหน่ง",
      "ปักหมุดตำแหน่งงานเด่น 20 ตำแหน่ง",
      "ดูโปรไฟล์ผู้สมัครเชิงลึก 500 คน",
      "ระบบ AI Match & ส่งคำเชิญตรง",
      "ผู้ช่วยดูแลบัญชีส่วนตัว (Dedicated Support)",
    ],
  },
];

@Injectable()
export class AdminPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Package Tier Definitions (CRUD) ────────────────────────────────────────

  /** ดึงคำนิยาม Package ทั้ง 3 tier จาก DB
   *  ถ้ายังไม่มีในฐานข้อมูล → seed ค่า default อัตโนมัติแล้วคืนค่า
   */
  async getTiers() {
    const existing = await this.prisma.packageTierDefinition.findMany({ orderBy: { sortOrder: "asc" } });
    if (existing.length >= 3) {
      return existing;
    }
    // Seed any missing tier safely with upsert
    for (const tier of DEFAULT_TIERS) {
      await this.prisma.packageTierDefinition.upsert({
        where: { plan: tier.plan },
        create: tier,
        update: {},
      });
    }
    return this.prisma.packageTierDefinition.findMany({ orderBy: { sortOrder: "asc" } });
  }

  /** Admin แก้ไข Package Tier (upsert by plan) */
  async upsertTier(plan: PlanEnum, dto: UpsertTierDto) {
    return this.prisma.packageTierDefinition.upsert({
      where: { plan },
      create: { plan, ...dto },
      update: dto,
    });
  }

  // ─── Company Subscribers ──────────────────────────────────────────────────

  /** สรุปตัวเลขสำหรับ Stat Cards */
  async getStats() {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86_400_000);

    const [total, gold, platinum, expiringIn7, pendingPayments] = await Promise.all([
      this.prisma.company.count({ where: { plan: { not: "FREE" } } }),
      this.prisma.company.count({ where: { plan: "GOLD" } }),
      this.prisma.company.count({ where: { plan: "PLATINUM" } }),
      this.prisma.company.count({
        where: { plan: { not: "FREE" }, planExpiresAt: { gte: now, lte: in7 } },
      }),
      this.prisma.subscriptionPayment.count({ where: { status: "PENDING" } }),
    ]);

    return { total, gold, platinum, expiringIn7, pendingPayments };
  }

  /** รายการบริษัทที่มีการสมัคร Package (paid + free) */
  async getSubscribers(query: QuerySubscribersDto) {
    const now = new Date();
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const whereClause: Record<string, unknown> = {};

    if (query.plan && query.plan !== "all") {
      whereClause["plan"] = query.plan;
    }
    if (query.q) {
      const q = query.q;
      whereClause["OR"] = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (query.status && query.status !== "all") {
      if (query.status === "active") {
        whereClause["AND"] = [
          { plan: { not: "FREE" } },
          { OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: new Date(now.getTime() + 7 * 86_400_000) } }] },
        ];
      } else if (query.status === "expiring") {
        whereClause["planExpiresAt"] = { gte: now, lte: new Date(now.getTime() + 7 * 86_400_000) };
        whereClause["plan"] = { not: "FREE" };
      } else if (query.status === "expired") {
        whereClause["planExpiresAt"] = { lt: now };
        whereClause["plan"] = { not: "FREE" };
      }
    }

    const orderBy =
      query.sort === "latest"
        ? { planExpiresAt: "desc" as const }
        : query.sort === "name_asc"
          ? { name: "asc" as const }
          : { planExpiresAt: "asc" as const };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where: whereClause as any,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          logoColor: true,
          logoText: true,
          plan: true,
          planExpiresAt: true,
          createdAt: true,
          _count: { select: { jobs: true, payments: true } },
          payments: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, plan: true, amount: true, status: true, createdAt: true },
          },
        },
      }),
      this.prisma.company.count({ where: whereClause as any }),
    ]);

    const items = companies.map((c) => {
      const expiresAt = c.planExpiresAt;
      let status: "active" | "expiring" | "expired" | "free";
      if (c.plan === "FREE") {
        status = "free";
      } else if (!expiresAt) {
        status = "active";
      } else if (expiresAt < now) {
        status = "expired";
      } else if (expiresAt <= new Date(now.getTime() + 7 * 86_400_000)) {
        status = "expiring";
      } else {
        status = "active";
      }

      const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000) : null;

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        email: c.email,
        phone: c.phone,
        logoColor: c.logoColor,
        logoText: c.logoText,
        plan: c.plan,
        planExpiresAt: c.planExpiresAt?.toISOString() ?? null,
        status,
        daysLeft,
        jobCount: c._count.jobs,
        paymentCount: c._count.payments,
        pendingPayment: c.payments[0] ?? null,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  /** Admin แก้ไข plan หรือต่ออายุบริษัท */
  async updateSubscriber(companyId: string, dto: UpdateSubscriberDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("ไม่พบบริษัทนี้");

    const data: Record<string, unknown> = {};
    if (dto.plan !== undefined) data["plan"] = dto.plan;
    if (dto.planExpiresAt !== undefined) {
      data["planExpiresAt"] = dto.planExpiresAt ? new Date(dto.planExpiresAt) : null;
    }
    if (dto.suspend === true) {
      data["plan"] = "FREE";
      data["planExpiresAt"] = null;
    } else if (dto.suspend === false && company.plan === "FREE") {
      // unsuspend: do nothing extra, plan should be set via dto.plan
    }

    return this.prisma.company.update({ where: { id: companyId }, data: data as any });
  }

  // ─── Payment Reviews ─────────────────────────────────────────────────────

  /** ดึงรายการชำระเงินที่รอตรวจสอบ */
  async getPayments(status = "PENDING") {
    return this.prisma.subscriptionPayment.findMany({
      where: status && status !== "all" ? ({ status } as any) : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: { id: true, name: true, email: true, phone: true, plan: true, logoText: true, logoColor: true },
        },
      },
    });
  }

  /** Admin อนุมัติ/ปฏิเสธใบชำระเงิน */
  async reviewPayment(paymentId: string, dto: ReviewPaymentDto) {
    const payment = await this.prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException("ไม่พบรายการชำระเงิน");
    if (payment.status !== "PENDING") throw new BadRequestException("รายการนี้ตรวจสอบแล้ว");

    const updated = await this.prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: { status: dto.status, reviewedAt: new Date() },
    });

    if (dto.status === "APPROVED") {
      const durationDays = dto.durationDays ?? 30;
      const expiresAt = new Date(Date.now() + durationDays * 86_400_000);
      await this.prisma.company.update({
        where: { id: payment.companyId },
        data: { plan: payment.plan, planExpiresAt: expiresAt },
      });
    }

    return updated;
  }
}
