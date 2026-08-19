import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { Member } from "./member.entity";
@Module({ imports: [TypeOrmModule.forFeature([Member]), PassportModule.register({ defaultStrategy: "jwt" }), JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>("JWT_SECRET"), signOptions: { expiresIn: Number(config.get<string>("JWT_EXPIRES_IN_SECONDS") ?? 86400) } }) })], controllers: [AuthController], providers: [AuthService, JwtStrategy], exports: [JwtModule, PassportModule, AuthService] }) export class AuthModule {}
