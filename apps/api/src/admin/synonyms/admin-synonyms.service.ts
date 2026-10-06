import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { QuerySynonymsDto, SaveSynonymGroupDto } from "./dto/synonyms.dto";

const DEFAULT_TAXONOMY = [
  {
    name: "Cybersecurity Analyst",
    category: "Security",
    synonyms: ["นักวิเคราะห์ความปลอดภัยทางไซเบอร์", "Security Analyst", "SOC Analyst", "Information Security Specialist"],
  },
  {
    name: "Penetration Tester",
    category: "Security",
    synonyms: ["Pentester", "Ethical Hacker", "นักทดสอบเจาะระบบ", "Red Team Specialist", "Vulnerability Assessment"],
  },
  {
    name: "Developer",
    category: "Development",
    synonyms: ["นักเขียนโปรแกรม", "Programmer", "Software Engineer", "Coder", "วิศวกรซอฟต์แวร์"],
  },
  {
    name: "React",
    category: "Frontend",
    synonyms: ["React.js", "ReactJS", "Next.js", "React Native", "Frontend Developer"],
  },
  {
    name: "Network Engineer",
    category: "Network",
    synonyms: ["วิศวกรเครือข่าย", "Network Administrator", "ระบบเครือข่าย", "Networking", "CCNA"],
  },
  {
    name: "DevOps Engineer",
    category: "DevOps & Cloud",
    synonyms: ["SRE", "Site Reliability Engineer", "CI/CD Engineer", "Cloud Engineer", "วิศวกร DevOps"],
  },
  {
    name: "Data Analyst",
    category: "Data",
    synonyms: ["Data Scientist", "นักวิทยาศาสตร์ข้อมูล", "นักวิเคราะห์ข้อมูล", "BI Analyst"],
  },
  {
    name: "System Admin",
    category: "Infrastructure",
    synonyms: ["Administrator", "SysAdmin", "ผู้บริหารระบบ", "IT Support"],
  },
  {
    name: "Software Tester",
    category: "QA & Testing",
    synonyms: ["QA Engineer", "Quality Assurance", "Test Automation", "Software QA"],
  },
  {
    name: "Cloud Architect",
    category: "Cloud",
    synonyms: ["Cloud Solutions", "AWS Architect", "Azure Specialist", "GCP Engineer"],
  },
];

@Injectable()
export class AdminSynonymsService {
  private readonly logger = new Logger(AdminSynonymsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** ดึงรายการกลุ่มคำพ้องจาก PostgreSQL พร้อมการค้นหาและกรองหมวดหมู่ */
  async list(query?: QuerySynonymsDto) {
    const where: Record<string, any> = {};

    if (query?.category && query.category !== "all") {
      where["category"] = query.category;
    }

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where["OR"] = [
        { name: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { synonyms: { has: q } },
      ];
    }

    let items = await this.prisma.synonymGroup.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    // ถ้าในฐานข้อมูลยังไม่มีกลุ่มคำพ้องเลย ให้ auto-seed ค่าเริ่มต้น
    if (items.length === 0 && (!query?.search || !query.search.trim()) && (!query?.category || query.category === "all")) {
      const count = await this.prisma.synonymGroup.count();
      if (count === 0) {
        await this.seedDefaults();
        items = await this.prisma.synonymGroup.findMany({ orderBy: { updatedAt: "desc" } });
      }
    }

    // กรณีค้นหาแบบย่อยที่ภาษาไทยหรือคำใน array อาจไม่ตรง exact string ของ `has`
    if (query?.search && query.search.trim()) {
      const lowerQ = query.search.trim().toLowerCase();
      // ดึงเพิ่มเติมใน memory ถ้าค้นหาคำใน synonyms array แบบ substring
      const allForCategory = await this.prisma.synonymGroup.findMany({
        where: query.category && query.category !== "all" ? { category: query.category } : undefined,
        orderBy: { updatedAt: "desc" },
      });
      items = allForCategory.filter(
        (g: any) =>
          g.name.toLowerCase().includes(lowerQ) ||
          g.category.toLowerCase().includes(lowerQ) ||
          g.synonyms.some((s: string) => s.toLowerCase().includes(lowerQ)),
      );
    }

    return items;
  }

  /** สถิติภาพรวมพจนานุกรมคำพ้อง */
  async getStats() {
    const groups = await this.prisma.synonymGroup.findMany();
    const totalGroups = groups.length;
    let totalSynonyms = 0;
    const categoriesSet = new Set<string>();

    for (const g of groups) {
      totalSynonyms += g.synonyms.length;
      if (g.category) categoriesSet.add(g.category);
    }

    return {
      totalGroups,
      totalSynonyms,
      categoriesCount: categoriesSet.size,
      categories: Array.from(categoriesSet),
    };
  }

  /** บันทึกหรืออัปเดตกลุ่มคำพ้องลง PostgreSQL */
  async save(dto: SaveSynonymGroupDto, adminEmail?: string) {
    const cleanName = dto.name.trim();
    if (!cleanName) {
      throw new BadRequestException("ชื่อ Main Keyword ห้ามว่าง");
    }

    // ทำความสะอาด synonyms (ตัดช่องว่าง, ลบคำซ้ำ, ลบคำว่าง)
    const cleanSynonyms = Array.from(
      new Set(
        dto.synonyms
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.toLowerCase() !== cleanName.toLowerCase()),
      ),
    );

    if (dto.id) {
      // ตรวจสอบว่ามีกลุ่มคำนี้อยู่จริง
      const existing = await this.prisma.synonymGroup.findUnique({ where: { id: dto.id } });
      if (!existing) {
        throw new NotFoundException("ไม่พบกลุ่มคำพ้องที่ต้องการแก้ไข");
      }

      // ตรวจสอบว่าชื่อใหม่ไม่ไปซ้ำกับรายการอื่น
      const duplicate = await this.prisma.synonymGroup.findFirst({
        where: {
          name: { equals: cleanName, mode: "insensitive" },
          id: { not: dto.id },
        },
      });
      if (duplicate) {
        throw new ConflictException(`Main Keyword "${cleanName}" มีอยู่ในระบบแล้ว`);
      }

      return this.prisma.synonymGroup.update({
        where: { id: dto.id },
        data: {
          name: cleanName,
          category: dto.category || "General",
          synonyms: cleanSynonyms,
          autoAiGenerated: dto.autoAiGenerated ?? existing.autoAiGenerated,
          updatedBy: adminEmail ?? "Admin",
        },
      });
    }

    // สร้างใหม่: ตรวจสอบความซ้ำซ้อน
    const duplicate = await this.prisma.synonymGroup.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } },
    });
    if (duplicate) {
      throw new ConflictException(`Main Keyword "${cleanName}" มีอยู่ในระบบแล้ว`);
    }

    return this.prisma.synonymGroup.create({
      data: {
        name: cleanName,
        category: dto.category || "General",
        synonyms: cleanSynonyms,
        autoAiGenerated: dto.autoAiGenerated ?? false,
        updatedBy: adminEmail ?? "Admin",
      },
    });
  }

  /** ลบกลุ่มคำพ้องออกจาก PostgreSQL */
  async remove(id: string) {
    const existing = await this.prisma.synonymGroup.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("ไม่พบกลุ่มคำพ้องที่ต้องการลบ");
    }

    await this.prisma.synonymGroup.delete({ where: { id } });
    this.logger.log(`Deleted synonym group: ${existing.name} (${id})`);
    return { success: true, deletedId: id };
  }

  /** เติมค่าเริ่มต้นหมวดหมู่คำพ้องสาย IT & Cyber */
  async seedDefaults() {
    for (const item of DEFAULT_TAXONOMY) {
      await this.prisma.synonymGroup.upsert({
        where: { name: item.name },
        create: {
          name: item.name,
          category: item.category,
          synonyms: item.synonyms,
          updatedBy: "System Seed",
        },
        update: {
          category: item.category,
          synonyms: item.synonyms,
        },
      });
    }
    return { success: true, seededCount: DEFAULT_TAXONOMY.length };
  }

  /**
   * AI-powered Synonym Suggestions
   * ขยายคำค้นหาและทักษะอัตโนมัติด้วย AI
   */
  async aiSuggest(keyword: string) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an IT & Cybersecurity recruitment specialist. Give a JSON list of 5-8 closely related synonym terms, alternative job titles, and equivalent technical skills (in English and Thai) for the keyword: "${keyword}". Return ONLY a JSON array of strings, for example: ["term1", "term2", "term3"]. Do not include markdown codeblocks or explanation.`,
                    },
                  ],
                },
              ],
            }),
          },
        );
        if (response.ok) {
          const result = await response.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return {
              keyword,
              suggestions: parsed,
              source: "Google Gemini AI",
            };
          }
        }
      } catch (err) {
        // Fallback to built-in intelligent taxonomy below
      }
    }

    // Built-in Intelligent IT & Cyber Taxonomy Engine
    const kw = keyword.toLowerCase();
    const taxonomyMap: Record<string, string[]> = {
      soc: ["Security Operations Center", "SOC Analyst Tier 1", "SOC Analyst Tier 2", "Incident Responder", "SIEM Operator"],
      react: ["ReactJS", "Next.js", "React Native", "Redux", "Frontend Developer", "JavaScript", "TypeScript"],
      cyber: ["Cybersecurity", "Information Security", "InfoSec", "ความปลอดภัยทางไซเบอร์", "IT Security", "Network Security"],
      pentest: ["Penetration Testing", "Ethical Hacker", "ทดสอบเจาะระบบ", "Red Teaming", "OWASP", "Burp Suite"],
      python: ["Python Developer", "Django", "FastAPI", "Flask", "Data Analysis", "Automation Scripting"],
      cloud: ["Cloud Engineer", "AWS", "Azure", "GCP", "DevOps", "Infrastructure as Code", "Terraform"],
      network: ["Network Engineer", "CCNA", "CCNP", "Firewall", "Cisco", "Routing and Switching", "Network Security"],
      developer: ["Software Engineer", "Programmer", "Fullstack Developer", "Backend Developer", "Frontend Developer"],
      data: ["Data Scientist", "Data Engineer", "Business Intelligence", "Power BI", "SQL Developer"],
      tester: ["QA Engineer", "Quality Assurance", "Software Tester", "Automation Tester", "Selenium", "Cypress"],
    };

    let matched: string[] = [];
    for (const [key, terms] of Object.entries(taxonomyMap)) {
      if (kw.includes(key)) {
        matched = terms;
        break;
      }
    }

    if (matched.length === 0) {
      matched = [
        `${keyword} Specialist`,
        `Senior ${keyword}`,
        `${keyword} Engineer`,
        `ผู้เชี่ยวชาญด้าน ${keyword}`,
      ];
    }

    return {
      keyword,
      suggestions: matched,
      source: "CyberJob AI Skill Engine",
    };
  }
}
