import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { CurrentOwner, OwnerGuard, type OwnerContext } from "../auth/owner.guard";
import { IMAGE_MAX_BYTES, multerOptions, removeStored, saveUpload, type StoredFile } from "../common/files";
import { PrismaService } from "../prisma/prisma.service";

/** ประเภทปัญหาสำหรับผู้ประกอบการ (Owner Feature 6.2) */
export const OWNER_PROBLEM_TOPICS = [
  "ปัญหาการเข้าสู่ระบบ",
  "ปัญหาการประกาศงาน",
  "ปัญหาการค้นหา/ดูข้อมูลผู้สมัคร",
  "ปัญหาการยืนยันบริษัท",
  "ปัญหาการชำระเงิน/แพ็กเกจ",
  "อื่น ๆ",
] as const;

const MAX_IMAGES = 3;

export class ReportProblemDto {
  @IsIn(OWNER_PROBLEM_TOPICS, { message: "กรุณาเลือกประเภทปัญหา" })
  topic!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsEmail({}, { message: "รูปแบบอีเมลไม่ถูกต้อง" })
  email!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(10, { message: "กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร" })
  @MaxLength(4000)
  message!: string;
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async report(owner: OwnerContext, dto: ReportProblemDto, images: Express.Multer.File[] = []) {
    const saved: StoredFile[] = [];
    try {
      for (const image of images.slice(0, MAX_IMAGES)) {
        saved.push(await saveUpload(image, { kind: "image", visibility: "private", label: "รูปภาพประกอบ" }));
      }
      // รูปแบบเลขอ้างอิงเดียวกับแบบฟอร์มติดต่อฝั่ง member
      const ref = `TK-${Date.now().toString(36).toUpperCase()}`;
      await this.prisma.supportTicket.create({
        data: {
          ref,
          name: owner.name,
          email: dto.email,
          topic: `[ผู้ประกอบการ] ${dto.topic}`,
          message: dto.message,
          userId: owner.userId,
          attachments: saved.map((file) => file.path),
        },
      });
      return { ticketId: ref, message: "ได้รับเรื่องเรียบร้อยแล้ว ทีมงานจะติดต่อกลับภายใน 1 วันทำการ" };
    } catch (error) {
      await removeStored(saved);
      throw error;
    }
  }
}

@Controller("owner/support")
@UseGuards(OwnerGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get("topics")
  topics() {
    return OWNER_PROBLEM_TOPICS;
  }

  @Post("reports")
  @UseInterceptors(FilesInterceptor("images", MAX_IMAGES, multerOptions(IMAGE_MAX_BYTES, MAX_IMAGES)))
  report(
    @CurrentOwner() owner: OwnerContext,
    @Body() dto: ReportProblemDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.support.report(owner, dto, images);
  }
}
