import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { SubscriptionPayment } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { OwnerContext } from "../auth/owner.guard";
import { CandidatePoolService } from "../candidates/candidate-pool.service";
import { removeStored, saveUpload } from "../common/files";
import { autoApprove, effectivePlan, PLAN_PERIOD_DAYS, PLANS } from "../common/plans";
import type { CreatePaymentDto } from "./dto";

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pool: CandidatePoolService,
  ) {}

  private paymentInfo() {
    return {
      promptPayId: process.env.PAYMENT_PROMPTPAY_ID ?? "0105561234567",
      bankName: process.env.PAYMENT_BANK_NAME ?? "ธนาคารกสิกรไทย",
      accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME ?? "บริษัท ไซเบอร์จ็อบ จำกัด",
      accountNo: process.env.PAYMENT_BANK_ACCOUNT_NO ?? "123-4-56789-0",
    };
  }

  private toPayment(payment: SubscriptionPayment) {
    return {
      id: payment.id,
      plan: payment.plan,
      planName: PLANS[payment.plan].name,
      amount: payment.amount,
      method: payment.method === "PROMPTPAY" ? "promptpay" : "bank_transfer",
      status: payment.status.toLowerCase(),
      proofName: payment.proofName,
      createdAt: payment.createdAt.toISOString(),
      reviewedAt: payment.reviewedAt?.toISOString() ?? null,
    };
  }

  /** หน้าแพ็กเกจ (Owner Feature 9) */
  async packages(owner: OwnerContext) {
    const company = await this.pool.company(owner.companyId);
    const payments = await this.prisma.subscriptionPayment.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return {
      plans: Object.values(PLANS).map((plan) => ({
        plan: plan.plan,
        name: plan.name,
        price: plan.price,
        period: "monthly",
        features: plan.features,
        recommended: Boolean(plan.recommended),
      })),
      current: {
        plan: effectivePlan(company),
        expiresAt: company.plan !== "FREE" ? (company.planExpiresAt?.toISOString() ?? null) : null,
      },
      pendingPayment: payments.find((payment) => payment.status === "PENDING")
        ? this.toPayment(payments.find((payment) => payment.status === "PENDING")!)
        : null,
      payments: payments.map((payment) => this.toPayment(payment)),
      paymentInfo: this.paymentInfo(),
    };
  }

  async createPayment(owner: OwnerContext, dto: CreatePaymentDto, file: Express.Multer.File | undefined) {
    const company = await this.pool.company(owner.companyId);
    const plan = PLANS[dto.plan];
    if (plan.price <= 0) throw new BadRequestException("แพ็กเกจ FREE ไม่ต้องชำระเงิน");

    const pending = await this.prisma.subscriptionPayment.findFirst({
      where: { companyId: company.id, status: "PENDING" },
      select: { id: true },
    });
    if (pending) throw new ConflictException("มีรายการชำระเงินที่รอตรวจสอบอยู่แล้ว");

    const proof = await saveUpload(file, { kind: "document", visibility: "private", label: "หลักฐานการชำระเงิน" });
    const approved = autoApprove();

    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.subscriptionPayment.create({
          data: {
            companyId: company.id,
            plan: dto.plan,
            amount: plan.price,
            method: dto.method === "promptpay" ? "PROMPTPAY" : "BANK_TRANSFER",
            proofPath: proof.path,
            proofName: proof.name,
            status: approved ? "APPROVED" : "PENDING",
            reviewedAt: approved ? new Date() : null,
          },
        });
        if (approved) {
          // ต่ออายุต่อจากวันหมดอายุเดิมถ้ายังเป็นแพ็กเกจเดิมและยังไม่หมด
          const current = effectivePlan(company);
          const start = current === dto.plan && company.planExpiresAt ? company.planExpiresAt : new Date();
          await tx.company.update({
            where: { id: company.id },
            data: { plan: dto.plan, planExpiresAt: new Date(start.getTime() + PLAN_PERIOD_DAYS * DAY) },
          });
        }
        return created;
      });
      return this.toPayment(payment);
    } catch (error) {
      await removeStored([proof]);
      throw error;
    }
  }

  async payment(owner: OwnerContext, id: string) {
    const company = await this.pool.company(owner.companyId);
    const payment = await this.prisma.subscriptionPayment.findFirst({ where: { id, companyId: company.id } });
    if (!payment) throw new NotFoundException("ไม่พบรายการชำระเงิน");
    return this.toPayment(payment);
  }
}
