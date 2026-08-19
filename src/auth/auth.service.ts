import { ConflictException, Injectable, NotFoundException, OnApplicationBootstrap, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Repository } from "typeorm";
import { CredentialsDto } from "./auth.dto";
import { Member } from "./member.entity";

const deriveKey = promisify(pbkdf2);
const DEMO_EMAIL = "user@test.com";
const DEMO_PASSWORD = "usertest555";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Member) private readonly members: Repository<Member>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (!this.demoEnabled()) return;
    try {
      const existing = await this.members.findOneBy({ email: DEMO_EMAIL });
      if (!existing) await this.members.save(this.members.create({ id: DEMO_USER_ID, email: DEMO_EMAIL, passwordHash: await this.hash(DEMO_PASSWORD), isDemo: true }));
    } catch (error) {
      if (this.config.get<string>("NODE_ENV") === "production") throw error;
    }
  }

  async register(dto: CredentialsDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.members.findOneBy({ email })) throw new ConflictException("อีเมลนี้ถูกใช้งานแล้ว");
    const member = await this.members.save(this.members.create({ email, passwordHash: await this.hash(dto.password) }));
    return this.session(member);
  }

  async login(dto: CredentialsDto) {
    const member = await this.members.findOneBy({ email: dto.email.trim().toLowerCase() });
    if (!member || !(await this.verify(dto.password, member.passwordHash))) throw new UnauthorizedException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    return this.session(member);
  }

  async demo() {
    if (!this.demoEnabled()) throw new NotFoundException();
    return this.session({ id: DEMO_USER_ID, email: DEMO_EMAIL, isDemo: true } as Member);
  }

  private demoEnabled() {
    return this.config.get<string>("NODE_ENV") !== "production" && this.config.get<string>("DEMO_ACCOUNT_ENABLED") !== "false";
  }

  private session(member: Member) {
    return { accessToken: this.jwt.sign({ sub: member.id, email: member.email, roles: ["member"] }), user: { id: member.id, email: member.email, isDemo: member.isDemo } };
  }

  private async hash(password: string) {
    const salt = randomBytes(16);
    const key = await deriveKey(password, salt, 120_000, 32, "sha256");
    return `pbkdf2$120000$${salt.toString("hex")}$${key.toString("hex")}`;
  }

  private async verify(password: string, encoded: string) {
    const [algorithm, iterations, saltHex, hashHex] = encoded.split("$");
    if (algorithm !== "pbkdf2" || !iterations || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    const actual = await deriveKey(password, Buffer.from(saltHex, "hex"), Number(iterations), expected.length, "sha256");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
