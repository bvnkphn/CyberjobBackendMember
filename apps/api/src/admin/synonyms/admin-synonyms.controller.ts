import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AdminSynonymsService } from "./admin-synonyms.service";
import { AiSuggestDto, QuerySynonymsDto, SaveSynonymGroupDto } from "./dto/synonyms.dto";
import type { Request } from "express";
import type { RequestUser } from "../auth/jwt.strategy";

@Controller("admin/synonyms")
@UseGuards(AdminGuard)
export class AdminSynonymsController {
  constructor(private readonly synonyms: AdminSynonymsService) {}

  /** ดึงสถิติภาพรวมกลุ่มคำพ้อง */
  @Get("stats")
  getStats() {
    return this.synonyms.getStats();
  }

  /** ค้นหาและแสดงรายการกลุ่มคำพ้อง */
  @Get()
  list(@Query(new ValidationPipe({ transform: true })) query: QuerySynonymsDto) {
    return this.synonyms.list(query);
  }

  /** สร้างหรือแก้ไขกลุ่มคำพ้อง */
  @Post()
  save(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) body: SaveSynonymGroupDto,
    @Req() req: Request & { user?: RequestUser },
  ) {
    return this.synonyms.save(body, req.user?.email);
  }

  /** ลบกลุ่มคำพ้อง */
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.synonyms.remove(id);
  }

  /** AI ช่วยแนะนำคำพ้องและทักษะที่เกี่ยวข้อง */
  @Post("ai-suggest")
  aiSuggest(@Body(new ValidationPipe({ transform: true })) body: AiSuggestDto) {
    return this.synonyms.aiSuggest(body.keyword);
  }

  /** เติมค่าเริ่มต้นหมวดหมู่คำพ้อง */
  @Post("seed-defaults")
  seedDefaults() {
    return this.synonyms.seedDefaults();
  }
}
