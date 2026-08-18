import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CandidateProfile } from "./candidate-profile.entity";
import { SaveGateDto } from "./profile.dto";
import { ProfileSection } from "./profile-section.enum";

@Injectable()
export class ProfilesService {
  constructor(@InjectRepository(CandidateProfile) private readonly profiles: Repository<CandidateProfile>) {}

  private async getOrCreate(userId: string) {
    return (await this.profiles.findOneBy({ userId })) ?? this.profiles.create({ userId });
  }

  async get(userId: string) {
    const profile = await this.profiles.findOneBy({ userId });
    if (!profile) throw new NotFoundException("ยังไม่พบข้อมูลโปรไฟล์");
    return { ...profile, completion: this.calculateCompletion(profile) };
  }

  async saveGate(userId: string, dto: SaveGateDto) {
    const profile = await this.getOrCreate(userId);
    Object.assign(profile, dto, { gateCompleted: true });
    return this.profiles.save(profile);
  }

  async skipGate(userId: string, privacy: "public" | "private" = "private") {
    const profile = await this.getOrCreate(userId);
    profile.gateCompleted = true;
    profile.privacy = privacy;
    return this.profiles.save(profile);
  }

  async updateSection(userId: string, section: ProfileSection, data: Record<string, unknown>) {
    const profile = await this.getOrCreate(userId);
    (profile as unknown as Record<string, unknown>)[section] = data;
    const saved = await this.profiles.save(profile);
    return { section, data: (saved as unknown as Record<string, unknown>)[section], completion: this.calculateCompletion(saved), updatedAt: saved.updatedAt };
  }

  private calculateCompletion(profile: CandidateProfile) {
    const sections: unknown[] = [profile.personal, profile.desiredJob, profile.educations, profile.workExperiences, profile.certificates, profile.languages, profile.otherSkills];
    const completed = sections.filter((section) => Array.isArray(section) ? section.length > 0 : Object.keys(section ?? {}).length > 0).length;
    return Math.round((completed / sections.length) * 100);
  }
}
