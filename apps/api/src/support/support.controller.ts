import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateSupportDto } from './dto/create-support.dto';
import { SupportService } from './support.service';

/** Feature 3.4 – Contact Support */
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post()
  create(
    @Body() dto: CreateSupportDto,
  ): Promise<{ ticketId: string; message: string }> {
    return this.support.create(dto);
  }

  /** หัวข้อที่ให้เลือกในฟอร์มติดต่อ */
  @Get('topics')
  topics(): string[] {
    return this.support.topics();
  }
}
