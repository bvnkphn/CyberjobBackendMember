import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';

export const SUPPORT_TOPICS = [
  'ปัญหาการเข้าสู่ระบบ',
  'ปัญหาการสมัครงาน',
  'ปัญหาการฝากประวัติ / เรซูเม่',
  'สอบถามสำหรับผู้ประกอบการ',
  'แจ้งประกาศงานที่ไม่เหมาะสม',
  'อื่น ๆ',
];

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupportDto): Promise<{ ticketId: string; message: string }> {
    const ref = `TK-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.supportTicket.create({
      data: {
        ref,
        name: dto.name,
        email: dto.email,
        topic: dto.topic,
        message: dto.message,
      },
    });

    return {
      ticketId: ref,
      message: 'ได้รับเรื่องเรียบร้อยแล้ว ทีมงานจะติดต่อกลับภายใน 1 วันทำการ',
    };
  }

  topics(): string[] {
    return SUPPORT_TOPICS;
  }
}
