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

  async get(userId: string, email?: string) {
    const profile = await this.profiles.findOneBy({ userId });
    if (!profile) throw new NotFoundException("ยังไม่พบข้อมูลโปรไฟล์");
    return {
      ...profile,
      firstName: profile.firstName ?? this.stringValue(profile.personal?.firstName),
      lastName: profile.lastName ?? this.stringValue(profile.personal?.lastName),
      address: profile.address ?? this.stringValue(profile.personal?.address),
      email: email ?? null,
      completion: this.calculateCompletion(profile),
    };
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
    if (section === ProfileSection.Personal) {
      profile.firstName = this.stringValue(data.firstName);
      profile.lastName = this.stringValue(data.lastName);
      profile.address = this.stringValue(data.address);
    }
    const saved = await this.profiles.save(profile);
    return { section, data: (saved as unknown as Record<string, unknown>)[section], completion: this.calculateCompletion(saved), updatedAt: saved.updatedAt };
  }

  private calculateCompletion(profile: CandidateProfile) {
    const requirements: Array<[unknown, Record<string, number>]> = [
      [profile.personal, { firstName: 4, lastName: 4, gender: 3, birthDay: 3, birthMonth: 3, birthYear: 3, nationality: 3, phone: 5, address: 7 }],
      [profile.desiredJob, { desiredPosition1: 8, desiredJobType1: 6, workplacePreference: 3, availableStartDate: 3 }],
      [profile.educations, { education1Level: 4, education1Institution: 4, education1Faculty: 2, education1Year: 3, education1Major: 2 }],
      [profile.workExperiences, { workExperience1StartMonth: 1, workExperience1StartYear: 1, workExperience1EndMonth: 1, workExperience1EndYear: 1, workExperience1Company: 3, workExperience1Position: 3 }],
      [profile.languages, { language1Name: 2, language1Listening: 2, language1Speaking: 2, language1Reading: 2, language1Writing: 2 }],
      [profile.certificates, { certificate1Title: 2.5, certificate1FileName: 2.5 }],
      [profile.otherSkills, { specialty1: 3, projects: 2 }],
    ];
    const score = requirements.reduce((total, [section, fields]) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) return total;
      const data = section as Record<string, unknown>;
      return total + Object.entries(fields).reduce((subtotal, [field, weight]) => subtotal + (String(data[field] ?? "").trim() ? weight : 0), 0);
    }, 0);
    return Math.round(score);
  }

  private stringValue(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
}
