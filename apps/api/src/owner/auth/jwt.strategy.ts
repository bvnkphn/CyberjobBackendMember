import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RequestUser {
  id: string;
  email: string;
  role: string;
}

/**
 * ตรวจ access token ที่ API ฝั่ง member ออกให้
 * ผู้ประกอบการเข้าสู่ระบบผ่านหน้าเว็บ member จึงต้องใช้ JWT_ACCESS_SECRET ชุดเดียวกัน
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
