import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, ValidationPipe } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AdminPackagesService } from "./admin-packages.service";
import type { PlanEnum } from "./dto/packages.dto";
import { QuerySubscribersDto, ReviewPaymentDto, UpdateSubscriberDto, UpsertTierDto } from "./dto/packages.dto";

@Controller("admin/packages")
@UseGuards(AdminGuard)
export class AdminPackagesController {
  constructor(private readonly packages: AdminPackagesService) {}

  // ─── Tier Definitions ─────────────────────────────────────────────────────

  /** GET /admin/packages/tiers — ดึงคำนิยาม Package ทั้งหมด */
  @Get("tiers")
  getTiers() {
    return this.packages.getTiers();
  }

  /** PATCH /admin/packages/tiers/:plan — แก้ไขคำนิยาม Package (FREE | GOLD | PLATINUM) */
  @Patch("tiers/:plan")
  upsertTier(
    @Param("plan") plan: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpsertTierDto,
  ) {
    return this.packages.upsertTier(plan.toUpperCase() as PlanEnum, dto);
  }

  // ─── Subscribers ─────────────────────────────────────────────────────────

  /** GET /admin/packages/stats — ตัวเลข stat cards */
  @Get("stats")
  getStats() {
    return this.packages.getStats();
  }

  /** GET /admin/packages/subscribers — รายการบริษัทที่ใช้แพ็กเกจ */
  @Get("subscribers")
  getSubscribers(
    @Query(new ValidationPipe({ whitelist: true, transform: true })) query: QuerySubscribersDto,
  ) {
    return this.packages.getSubscribers(query);
  }

  /** PATCH /admin/packages/subscribers/:id — แก้ไข plan / ต่ออายุ / suspend */
  @Patch("subscribers/:id")
  updateSubscriber(
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateSubscriberDto,
  ) {
    return this.packages.updateSubscriber(id, dto);
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  /** GET /admin/packages/payments — รายการชำระเงิน */
  @Get("payments")
  getPayments(@Query("status") status?: string) {
    return this.packages.getPayments(status);
  }

  /** POST /admin/packages/payments/:id/review — อนุมัติ/ปฏิเสธ */
  @Post("payments/:id/review")
  reviewPayment(
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: ReviewPaymentDto,
  ) {
    return this.packages.reviewPayment(id, dto);
  }
}
