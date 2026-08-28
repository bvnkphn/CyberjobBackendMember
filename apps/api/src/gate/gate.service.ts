import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PROFILE_SECTIONS, SaveGateDto, type ProfileSection } from './dto/gate.dto';

@Injectable()
export class GateService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, dto: SaveGateDto) {
    await this.assertJobseeker(userId);
    const [, profile] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          gateCompleted: true,
          gateSkipped: false,
          gateCompletedAt: new Date(),
          name: `${dto.firstName} ${dto.lastName}`.trim(),
        },
      }),
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
      this.prisma.user.update({
        where: { id: userId },
        data: { gateCompleted: true, gateSkipped: true, gateCompletedAt: new Date() },
      }),
      this.prisma.candidateProfile.upsert({ where: { userId }, create: { userId, privacy }, update: { privacy } }),
    ]);
    return { ok: true as const, gateCompleted: true };
  }

  async profile(userId: string) {
    const row = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!row) throw new NotFoundException('ไม่พบบัญชีผู้ใช้');
    const sections = this.sections(row.profile?.sections);
    return {
      email: row.email,
      firstName: row.profile?.firstName ?? this.text(sections.personal.firstName),
      lastName: row.profile?.lastName ?? this.text(sections.personal.lastName),
      address: row.profile?.address ?? this.text(sections.personal.address),
      desiredJobCategories: row.profile?.desiredJobCategories ?? [],
      privacy: row.profile?.privacy === 'public' ? 'public' : 'private',
      gateCompleted: row.gateCompleted,
      gateSkipped: row.gateSkipped,
      gateCompletedAt: row.gateCompletedAt?.toISOString() ?? null,
      ...sections,
      completion: this.calculateCompletion(sections),
      updatedAt: row.profile?.updatedAt.toISOString() ?? row.updatedAt.toISOString(),
    };
  }

  async updateProfileSection(userId: string, section: ProfileSection, data: Record<string, unknown>) {
    await this.assertJobseeker(userId);
    if (!PROFILE_SECTIONS.includes(section)) throw new BadRequestException('ส่วนของโปรไฟล์ไม่ถูกต้อง');
    const existing = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    const sections = this.sections(existing?.sections);
    sections[section] = data;
    const personal = section === 'personal' ? data : sections.personal;
    const profile = await this.prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        sections: sections as Prisma.InputJsonValue,
        firstName: this.text(personal.firstName),
        lastName: this.text(personal.lastName),
        address: this.text(personal.address),
      },
      update: {
        sections: sections as Prisma.InputJsonValue,
        ...(section === 'personal' ? {
          firstName: this.text(data.firstName),
          lastName: this.text(data.lastName),
          address: this.text(data.address),
        } : {}),
      },
    });
    return { section, data, completion: this.calculateCompletion(sections), updatedAt: profile.updatedAt.toISOString() };
  }

  private sections(value: Prisma.JsonValue | null | undefined): Record<ProfileSection, Record<string, unknown>> {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return Object.fromEntries(PROFILE_SECTIONS.map((section) => {
      const item = source[section];
      return [section, item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : {}];
    })) as Record<ProfileSection, Record<string, unknown>>;
  }

  private calculateCompletion(sections: Record<ProfileSection, Record<string, unknown>>) {
    const weights: Partial<Record<ProfileSection, Record<string, number>>> = {
      personal: { firstName: 4, lastName: 4, gender: 3, birthDay: 3, birthMonth: 3, birthYear: 3, nationality: 3, phone: 5, address: 7 },
      desiredJob: { desiredPosition1: 8, desiredJobType1: 6, workplacePreference: 3, availableStartDate: 3 },
      educations: { education1Level: 4, education1Institution: 4, education1Faculty: 2, education1Year: 3, education1Major: 2 },
      workExperiences: { workExperience1StartMonth: 1, workExperience1StartYear: 1, workExperience1EndMonth: 1, workExperience1EndYear: 1, workExperience1Company: 3, workExperience1Position: 3 },
      languages: { language1Name: 2, language1Listening: 2, language1Speaking: 2, language1Reading: 2, language1Writing: 2 },
      certificates: { certificate1Title: 2.5, certificate1FileName: 2.5 },
      otherSkills: { specialty1: 3, projects: 2 },
    };
    return Math.round(Object.entries(weights).reduce((score, [section, fields]) => score + Object.entries(fields ?? {}).reduce((subtotal, [field, weight]) => subtotal + (this.text(sections[section as ProfileSection]?.[field]) ? weight : 0), 0), 0));
  }

  private text(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private async assertJobseeker(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'JOBSEEKER') {
      throw new ForbiddenException('บัญชีผู้ประกอบการต้องใช้ Gate ของ Owner');
    }
  }
}
