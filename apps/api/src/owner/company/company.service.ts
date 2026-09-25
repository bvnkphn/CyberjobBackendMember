import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Company, CompanyType, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import {
  openPrivateFile,
  publicUrl,
  removePublicByUrl,
  removeStored,
  saveUpload,
  type StoredFile,
} from "../common/files";
import { autoApprove, effectivePlan } from "../common/plans";
import type { OwnerContext } from "../auth/owner.guard";
import { DOCUMENT_TYPES, type DocumentType, type PrivacyDto, type RequestVerificationDto, type UpdateCompanyDto, type VerificationDto } from "./dto";

const COMPANY_TYPE: Record<string, CompanyType> = {
  private: "PRIVATE",
  government: "GOVERNMENT",
  state_enterprise: "STATE_ENTERPRISE",
};
const COMPANY_TYPE_TO_API: Record<CompanyType, string> = {
  PRIVATE: "private",
  GOVERNMENT: "government",
  STATE_ENTERPRISE: "state_enterprise",
};
const VERIFICATION_TO_API = {
  NOT_SUBMITTED: "not_submitted",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

const LOGO_COLORS = ["#1E3A8A", "#0EA5E9", "#22C55E", "#8B5CF6", "#F59E0B", "#EF4444", "#14B8A6"];
const MAX_GALLERY = 10;

export type DocumentFiles = Partial<Record<DocumentType, Express.Multer.File[]>>;
type StoredDocuments = Partial<Record<DocumentType, StoredFile[]>>;

const DOCUMENT_RULES: Record<DocumentType, { label: string; min: number; max: number; kind: "image" | "document" }> = {
  certificate: { label: "หนังสือรับรองบริษัท", min: 1, max: 1, kind: "document" },
  directorId: { label: "บัตรประชาชนกรรมการ", min: 1, max: 1, kind: "document" },
  workplace: { label: "รูปสำนักงาน", min: 1, max: 3, kind: "image" },
  vat: { label: "ภ.พ.20 (VAT)", min: 1, max: 1, kind: "document" },
};

function initials(name: string): string {
  const latin = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (latin.length) return latin.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  return name.replace(/^(บริษัท|บจก\.?|ห้างหุ้นส่วน)\s*/, "").trim().slice(0, 2) || "CJ";
}

function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  return `${base || "company"}-${randomBytes(3).toString("hex")}`;
}

/** ดึงพิกัดจากลิงก์ Google Maps แบบ ?q=lat,lng หรือ @lat,lng */
function coordinatesFrom(url: string): { lat: number; lng: number } | null {
  const match = url.match(/[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ?? url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  private documentsOf(company: Company): StoredDocuments {
    const value = company.documents;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as unknown as StoredDocuments) : {};
  }

  toProfile(company: Company) {
    const documents = this.documentsOf(company);
    return {
      id: company.id,
      slug: company.slug,
      name: company.name,
      legalName: company.legalName,
      companyType: COMPANY_TYPE_TO_API[company.companyType],
      businessType: company.businessType,
      employeeCount: company.employeeCount,
      about: company.about,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address: company.address,
      province: company.province,
      district: company.district,
      mapUrl: company.mapUrl,
      location: company.lat !== null && company.lng !== null ? { lat: company.lat, lng: company.lng } : null,
      logoUrl: company.logoUrl,
      logoText: company.logoText,
      logoColor: company.logoColor,
      coverImage: company.coverImage,
      gallery: company.gallery,
      registrationNumber: company.registrationNumber,
      contactName: company.contactName,
      contactPosition: company.contactPosition,
      contactPhone: company.contactPhone,
      verificationStatus: VERIFICATION_TO_API[company.verificationStatus],
      verificationSubmittedAt: company.verificationSubmittedAt?.toISOString() ?? null,
      isPublic: company.isPublic,
      plan: effectivePlan(company),
      planExpiresAt: company.planExpiresAt?.toISOString() ?? null,
      memberUrl: company.isPublic
        ? `${(process.env.MEMBER_WEB_URL ?? "http://localhost:3000").replace(/\/$/, "")}/companies/${company.slug}`
        : null,
      // ไม่ส่ง path จริงออกไป – เปิดไฟล์ผ่าน /owner/company/documents/:type/:index
      documents: Object.fromEntries(
        DOCUMENT_TYPES.map((type) => [
          type,
          (documents[type] ?? []).map((file) => ({ name: file.name, size: file.size, mimeType: file.mimeType })),
        ]),
      ),
    };
  }

  async get(owner: OwnerContext) {
    if (!owner.companyId) return null;
    const company = await this.prisma.company.findUnique({ where: { id: owner.companyId } });
    return company ? this.toProfile(company) : null;
  }

  private async own(owner: OwnerContext): Promise<Company> {
    if (!owner.companyId) throw new NotFoundException("กรุณากรอกข้อมูลบริษัทก่อน");
    const company = await this.prisma.company.findUnique({ where: { id: owner.companyId } });
    if (!company) throw new NotFoundException("กรุณากรอกข้อมูลบริษัทก่อน");
    return company;
  }

  /* ---------------- หน้า Gate: ส่งข้อมูลยืนยันบริษัท (Feature 8) ---------------- */

  async submitVerification(owner: OwnerContext, dto: VerificationDto, files: DocumentFiles) {
    const existing = owner.companyId ? await this.prisma.company.findUnique({ where: { id: owner.companyId } }) : null;
    if (existing && (existing.verificationStatus === "PENDING" || existing.verificationStatus === "APPROVED")) {
      throw new ConflictException(
        existing.verificationStatus === "PENDING"
          ? "ส่งข้อมูลไปแล้ว อยู่ระหว่างรอตรวจสอบ"
          : "บริษัทยืนยันแล้ว แก้ไขข้อมูลได้ที่หน้าโปรไฟล์บริษัท",
      );
    }

    for (const type of DOCUMENT_TYPES) {
      const rule = DOCUMENT_RULES[type];
      const count = files[type]?.length ?? 0;
      if (count < rule.min) throw new BadRequestException(`กรุณาแนบ${rule.label}`);
      if (count > rule.max) throw new BadRequestException(`${rule.label}แนบได้ไม่เกิน ${rule.max} ไฟล์`);
    }

    // บันทึกไฟล์หลังตรวจครบทุกช่อง ถ้าไฟล์ไหนไม่ผ่านให้ลบที่บันทึกไปแล้วทิ้ง
    const stored: StoredDocuments = {};
    const saved: StoredFile[] = [];
    try {
      for (const type of DOCUMENT_TYPES) {
        const rule = DOCUMENT_RULES[type];
        stored[type] = [];
        for (const file of files[type] ?? []) {
          const result = await saveUpload(file, { kind: rule.kind, visibility: "private", label: rule.label });
          stored[type]!.push(result);
          saved.push(result);
        }
      }
    } catch (error) {
      await removeStored(saved);
      throw error;
    }

    const approved = autoApprove();
    const data = {
      name: dto.companyName,
      legalName: dto.companyName,
      businessType: dto.businessType,
      employeeCount: dto.employeeRange ?? null,
      email: dto.companyEmail,
      phone: dto.companyPhone,
      website: dto.website ?? "",
      address: dto.address,
      province: dto.province,
      registrationNumber: dto.registrationNumber,
      contactName: dto.contactName,
      contactPosition: dto.contactPosition,
      contactPhone: dto.contactPhone,
      documents: stored as unknown as Prisma.InputJsonValue,
      verificationStatus: approved ? ("APPROVED" as const) : ("PENDING" as const),
      verified: approved,
      verificationSubmittedAt: new Date(),
    };

    let company: Company;
    if (existing) {
      await removeStored(Object.values(this.documentsOf(existing)).flat());
      company = await this.prisma.company.update({ where: { id: existing.id }, data });
    } else {
      company = await this.prisma.company.create({
        data: {
          ...data,
          slug: slugify(dto.companyName),
          logoText: initials(dto.companyName),
          logoColor: LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)],
          about: "",
          ownerId: owner.userId,
        },
      });
    }
    return this.toProfile(company);
  }

  async openDocument(owner: OwnerContext, type: string, index: number) {
    if (!DOCUMENT_TYPES.includes(type as DocumentType)) throw new NotFoundException("ไม่พบเอกสาร");
    const company = await this.own(owner);
    const file = this.documentsOf(company)[type as DocumentType]?.[index];
    if (!file) throw new NotFoundException("ไม่พบเอกสาร");
    return { file, stream: openPrivateFile(file.path) };
  }

  /* ---------------- โปรไฟล์บริษัท (Feature 3) ---------------- */

  async update(owner: OwnerContext, dto: UpdateCompanyDto) {
    const company = await this.own(owner);
    const data: Prisma.CompanyUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.companyType !== undefined) data.companyType = COMPANY_TYPE[dto.companyType];
    if (dto.businessType !== undefined) data.businessType = dto.businessType;
    if (dto.employeeCount !== undefined) data.employeeCount = dto.employeeCount || null;
    if (dto.about !== undefined) data.about = dto.about;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.province !== undefined) data.province = dto.province;
    if (dto.mapUrl !== undefined) {
      data.mapUrl = dto.mapUrl || null;
      const point = dto.mapUrl ? coordinatesFrom(dto.mapUrl) : null;
      data.lat = point?.lat ?? null;
      data.lng = point?.lng ?? null;
    }
    // ข้อมูลการยืนยันบริษัทจะบันทึกได้เฉพาะเมื่อส่งขอการยืนยัน (requestVerification) เท่านั้น
    // และสถานะจะเปลี่ยนเป็น PENDING เพื่อส่งให้ Admin อนุมัติเสมอ
    if (dto.requestVerification) {
      if (dto.registrationNumber !== undefined) data.registrationNumber = dto.registrationNumber || null;
      if (dto.contactName !== undefined) data.contactName = dto.contactName || null;
      if (dto.contactPosition !== undefined) data.contactPosition = dto.contactPosition || null;
      if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone || null;
      data.verificationStatus = "PENDING";
      data.verified = false;
      data.verificationSubmittedAt = new Date();
    }
    const updated = await this.prisma.company.update({ where: { id: company.id }, data });

    return this.toProfile(updated);
  }

  async requestVerification(owner: OwnerContext, dto: RequestVerificationDto) {
    const company = await this.own(owner);
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: {
        registrationNumber: dto.registrationNumber,
        contactName: dto.contactName || null,
        contactPosition: dto.contactPosition || null,
        contactPhone: dto.contactPhone || null,
        verificationStatus: "PENDING",
        verified: false,
        verificationSubmittedAt: new Date(),
      },
    });
    return this.toProfile(updated);
  }

  async privacy(owner: OwnerContext, dto: PrivacyDto) {
    const company = await this.own(owner);
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { isPublic: dto.visibility === "public" },
    });
    return this.toProfile(updated);
  }

  async setImage(owner: OwnerContext, slot: "logo" | "cover", file: Express.Multer.File | undefined) {
    const company = await this.own(owner);
    const stored = await saveUpload(file, { kind: "image", visibility: "public", label: slot === "logo" ? "โลโก้" : "รูปหน้าปก" });
    const url = publicUrl(stored);
    const previous = slot === "logo" ? company.logoUrl : company.coverImage;
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: slot === "logo" ? { logoUrl: url } : { coverImage: url },
    });
    await removePublicByUrl(previous);
    return this.toProfile(updated);
  }

  async removeImage(owner: OwnerContext, slot: "logo" | "cover") {
    const company = await this.own(owner);
    const previous = slot === "logo" ? company.logoUrl : company.coverImage;
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: slot === "logo" ? { logoUrl: null } : { coverImage: null },
    });
    await removePublicByUrl(previous);
    return this.toProfile(updated);
  }

  async addGallery(owner: OwnerContext, files: Express.Multer.File[] = []) {
    const company = await this.own(owner);
    if (!files.length) throw new BadRequestException("กรุณาเลือกรูปภาพ");
    if (company.gallery.length + files.length > MAX_GALLERY) {
      throw new BadRequestException(`แกลเลอรีมีรูปได้ไม่เกิน ${MAX_GALLERY} รูป`);
    }
    const saved: StoredFile[] = [];
    try {
      for (const file of files) saved.push(await saveUpload(file, { kind: "image", visibility: "public", label: "รูปภาพ" }));
    } catch (error) {
      await removeStored(saved);
      throw error;
    }
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { gallery: [...company.gallery, ...saved.map(publicUrl)] },
    });
    return this.toProfile(updated);
  }

  async removeGallery(owner: OwnerContext, index: number) {
    const company = await this.own(owner);
    const url = company.gallery[index];
    if (url === undefined) throw new NotFoundException("ไม่พบรูปภาพ");
    const updated = await this.prisma.company.update({
      where: { id: company.id },
      data: { gallery: company.gallery.filter((_, position) => position !== index) },
    });
    await removePublicByUrl(url);
    return this.toProfile(updated);
  }
}
