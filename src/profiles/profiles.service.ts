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
    const requirements: Array<[unknown, string[]]> = [
      [profile.personal, ["firstName", "lastName", "birthDay", "birthMonth", "birthYear", "phone", "address"]],
      [profile.desiredJob, ["desiredPosition1", "desiredJobType1"]],
      [profile.educations, ["education1Level", "education1Institution", "education1Faculty", "education1Year"]],
      [profile.workExperiences, [
        "workExperience1StartMonth", "workExperience1StartYear", "workExperience1EndMonth",
        "workExperience1EndYear", "workExperience1Company", "workExperience1Position",
      ]],
      [profile.certificates, ["certificate1Title", "certificate1FileName"]],
      [profile.languages, ["language1Name"]],
      [profile.otherSkills, ["specialty1"]],
    ];
    const completed = requirements.filter(([section, fields]) => this.hasRequiredValues(section, fields)).length;
    return Math.round((completed / requirements.length) * 100);
  }

  private hasRequiredValues(section: unknown, fields: string[]) {
    if (!section || typeof section !== "object" || Array.isArray(section)) return false;
    const data = section as Record<string, unknown>;
    return fields.every((field) => String(data[field] ?? "").trim().length > 0);
  }
}
