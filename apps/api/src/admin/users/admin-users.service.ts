import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  asSections,
  buildResume,
  certificates,
  desiredPositions,
  experienceYears,
  resumeScore,
} from "../common/resume";
import type { CandidateSource, QueryUsersDto } from "./dto/users.dto";

export interface AdminUserRow {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  experienceYears: number;
  desiredPosition: string | null;
  source: CandidateSource;
  /** null = ยังไม่ประเมิน (ยังไม่ผ่านขั้น Gate หรือยังไม่มีโปรไฟล์) */
  resumeScore: number | null;
  certificateCount: number;
  createdAt: string;
}

const CSV_HEADERS = [
  "UserID",
  "ชื่อผู้สมัคร",
  "Email",
  "เบอร์โทร",
  "อายุงาน (ปี)",
  "ตำแหน่งที่สนใจ",
  "ประเภท",
  "คะแนน Resume",
  "จำนวนใบประกาศนียบัตร",
  "วันที่สมัคร",
];

const SOURCE_LABEL: Record<CandidateSource, string> = {
  CYBERPAY_INTERN: "เด็กฝึก Cyberpay",
  OUTSIDER: "คนภายนอก",
};

/** กันสูตร Excel ที่ฝังมากับข้อมูลผู้ใช้ (CSV injection) และ escape เครื่องหมายคำพูด */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * อายุงาน ตำแหน่ง และคะแนนเรซูเม่คำนวณจาก JSON ในโปรไฟล์
   * จึงกรองและเรียงในหน่วยความจำ – เหมาะกับจำนวนผู้สมัครระดับหลักพัน
   * ถ้าโตกว่านั้นควรย้ายค่าที่คำนวณไปเก็บเป็นคอลัมน์แล้ว query ใน SQL
   */
  private async loadCandidates(): Promise<AdminUserRow[]> {
    const users = await this.prisma.user.findMany({
      where: { role: "JOBSEEKER" },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => {
      const sections = asSections(user.profile?.sections);
      const evaluated = Boolean(user.profile) && user.gateCompleted;
      const phone = sections.personal?.phone;
      return {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        experienceYears: experienceYears(sections),
        desiredPosition: desiredPositions(sections)[0] ?? null,
        source: user.candidateSource as CandidateSource,
        resumeScore: evaluated ? resumeScore(sections) : null,
        certificateCount: certificates(sections).length,
        createdAt: user.createdAt.toISOString(),
      };
    });
  }

  private applyQuery(rows: AdminUserRow[], query: QueryUsersDto): AdminUserRow[] {
    const term = query.q?.toLowerCase();
    const filtered = rows.filter((row) => {
      if (query.source && row.source !== query.source) return false;
      if (query.minYears !== undefined && row.experienceYears < query.minYears) return false;
      if (query.maxYears !== undefined && row.experienceYears > query.maxYears) return false;
      if (!term) return true;
      return [row.code, row.name, row.email, row.desiredPosition ?? ""]
        .some((value) => value.toLowerCase().includes(term));
    });

    if (query.sort === "experience_asc") {
      filtered.sort((a, b) => a.experienceYears - b.experienceYears || a.code.localeCompare(b.code));
    } else if (query.sort === "experience_desc") {
      filtered.sort((a, b) => b.experienceYears - a.experienceYears || a.code.localeCompare(b.code));
    }
    return filtered;
  }

  async list(query: QueryUsersDto) {
    const all = await this.loadCandidates();
    const filtered = this.applyQuery(all, query);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = Math.min(Math.max(1, query.page), totalPages);

    return {
      items: filtered.slice((page - 1) * query.pageSize, page * query.pageSize),
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    };
  }

  /** การ์ดสรุปด้านบน – นับจากผู้สมัครทั้งหมด ไม่ขึ้นกับตัวกรองในตาราง */
  async stats() {
    const grouped = await this.prisma.user.groupBy({
      by: ["candidateSource"],
      where: { role: "JOBSEEKER" },
      _count: { _all: true },
    });
    const count = (source: CandidateSource) =>
      grouped.find((group) => group.candidateSource === source)?._count._all ?? 0;

    const cyberpay = count("CYBERPAY_INTERN");
    const outsider = count("OUTSIDER");
    const total = cyberpay + outsider;
    const percent = (value: number) => (total ? Math.round((value / total) * 100) : 0);

    return {
      total,
      cyberpayIntern: { count: cyberpay, percent: percent(cyberpay) },
      outsider: { count: outsider, percent: percent(outsider) },
    };
  }

  async exportCsv(query: QueryUsersDto): Promise<string> {
    const rows = this.applyQuery(await this.loadCandidates(), query);
    const lines = [
      CSV_HEADERS.map(csvCell).join(","),
      ...rows.map((row) =>
        [
          row.code,
          row.name,
          row.email,
          row.phone,
          row.experienceYears,
          row.desiredPosition,
          SOURCE_LABEL[row.source],
          row.resumeScore ?? "ยังไม่ประเมิน",
          row.certificateCount,
          row.createdAt.slice(0, 10),
        ]
          .map(csvCell)
          .join(","),
      ),
    ];
    // BOM ทำให้ Excel อ่านภาษาไทยเป็น UTF-8 ถูกต้อง
    return `﻿${lines.join("\r\n")}\r\n`;
  }

  private async findCandidate(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: "JOBSEEKER" },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException("ไม่พบผู้สมัครรายนี้");
    return user;
  }

  async detail(id: string) {
    const user = await this.findCandidate(id);
    const sections = asSections(user.profile?.sections);
    const phone = sections.personal?.phone;
    return {
      id: user.id,
      code: user.code,
      name: user.name,
      email: user.email,
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      experienceYears: experienceYears(sections),
      desiredPosition: desiredPositions(sections)[0] ?? null,
      source: user.candidateSource as CandidateSource,
    };
  }

  async resume(id: string) {
    const user = await this.findCandidate(id);
    return buildResume(user, user.profile, asSections(user.profile?.sections));
  }

  async certificates(id: string) {
    const user = await this.findCandidate(id);
    const list = certificates(asSections(user.profile?.sections));
    return { total: list.length, items: list };
  }

  async updateSource(id: string, source: CandidateSource) {
    await this.findCandidate(id);
    await this.prisma.user.update({ where: { id }, data: { candidateSource: source } });
    return this.detail(id);
  }

  /**
   * ลบบัญชีผู้สมัครถาวร – โปรไฟล์ บุ๊กมาร์ก ประวัติสมัครงาน และ refresh token
   * ถูกลบตาม onDelete: Cascade ใน schema
   * จำกัดเฉพาะ role JOBSEEKER กันไม่ให้หน้านี้ลบบัญชีผู้ประกอบการหรือผู้ดูแลระบบ
   */
  async remove(id: string, actorId: string) {
    if (id === actorId) throw new BadRequestException("ไม่สามารถลบบัญชีของตัวเองได้");
    const result = await this.prisma.user.deleteMany({ where: { id, role: "JOBSEEKER" } });
    if (result.count === 0) throw new NotFoundException("ไม่พบผู้สมัครรายนี้");
    return { ok: true };
  }
}
