import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveGateDto } from './dto/gate.dto';

@Injectable()
export class GateService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, dto: SaveGateDto) {
    await this.assertJobseeker(userId);
    const [, profile] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { gateCompleted: true, name: `${dto.firstName} ${dto.lastName}`.trim() } }),
      this.prisma.candidateProfile.upsert({
        where: { userId },
        create: { userId, ...dto },
        update: dto,
      }),
    ]);
    return { ok: true as const, gateCompleted: true, profile };
  }

  async skip(userId: string, privacy = 'private') {
    await this.assertJobseeker(userId);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { gateCompleted: true } }),
      this.prisma.candidateProfile.upsert({ where: { userId }, create: { userId, privacy }, update: { privacy } }),
    ]);
    return { ok: true as const, gateCompleted: true };
  }

  async profile(userId: string) {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    return {
      email: row?.email ?? null,
      firstName: row?.profile?.firstName ?? null,
      lastName: row?.profile?.lastName ?? null,
      address: row?.profile?.address ?? null,
      desiredJobCategories: row?.profile?.desiredJobCategories ?? [],
      privacy: row?.profile?.privacy === 'public' ? 'public' : 'private',
      gateCompleted: row?.gateCompleted ?? false,
    };
  }

  private async assertJobseeker(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'JOBSEEKER') {
      throw new ForbiddenException('บัญชีผู้ประกอบการต้องใช้ Gate ของ Owner');
    }
  }
}
