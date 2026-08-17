import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
@Injectable() export class JwtStrategy extends PassportStrategy(Strategy) { constructor(config: ConfigService) { super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: config.getOrThrow<string>("JWT_SECRET") }); } validate(payload: { sub: string; email?: string; roles?: string[] }) { return { id: payload.sub, email: payload.email, roles: payload.roles ?? [] }; } }
