import type { Company, PackagePlan } from "@prisma/client";

export interface PlanDefinition {
  plan: PackagePlan;
  name: string;
  /** บาทต่อเดือน */
  price: number;
  features: string[];
  /** FREE: โพสต์ได้กี่ครั้งตลอดอายุบัญชี (นับทุกประกาศที่เคยเผยแพร่) */
  lifetimePosts: number | null;
  /** จำนวนประกาศที่เปิดรับสมัครพร้อมกันได้ – null = ไม่จำกัด */
  maxActiveJobs: number | null;
  /** ค้นหาผู้สมัครทั้งระบบ (Talent Search) */
  talentSearch: boolean;
  recommended?: boolean;
}

export const PLANS: Record<PackagePlan, PlanDefinition> = {
  FREE: {
    plan: "FREE",
    name: "FREE",
    price: 0,
    features: ["โพสต์งานฟรี 3 ครั้งแรก", "เห็นผู้สมัครที่มาสมัครงานเอง", "Bookmark และ Invite ได้ปกติ"],
    lifetimePosts: 3,
    maxActiveJobs: null,
    talentSearch: false,
  },
  GOLD: {
    plan: "GOLD",
    name: "GOLD",
    price: 1800,
    features: ["โพสต์พร้อมกันได้สูงสุด 15 ตำแหน่ง", "ค้นหาผู้สมัครเชิงรุกทั้งระบบ (Talent Search)", "ใช้ Filter เต็มรูปแบบ"],
    lifetimePosts: null,
    maxActiveJobs: 15,
    talentSearch: true,
  },
  PLATINUM: {
    plan: "PLATINUM",
    name: "PLATINUM",
    price: 5000,
    features: ["โพสต์งานไม่จำกัดจำนวน", "Stay on top บริษัทติดอันดับบนสุดเวลาเสิร์ช", "Priority Support ตอบไวกว่า Priority ปกติ"],
    lifetimePosts: null,
    maxActiveJobs: null,
    talentSearch: true,
    recommended: true,
  },
};

/** แพ็กเกจที่หมดอายุแล้วถือว่ากลับเป็น FREE */
export function effectivePlan(company: Pick<Company, "plan" | "planExpiresAt">, now = new Date()): PackagePlan {
  if (company.plan === "FREE") return "FREE";
  return company.planExpiresAt && company.planExpiresAt > now ? company.plan : "FREE";
}

export const PLAN_PERIOD_DAYS = 30;

export function autoApprove(): boolean {
  return process.env.OWNER_AUTO_APPROVE === "true";
}
