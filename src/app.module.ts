import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { ProfilesModule } from "./profiles/profiles.module";
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ type: "postgres", url: config.getOrThrow<string>("DATABASE_URL"), autoLoadEntities: true, synchronize: false, ssl: config.get("DB_SSL") === "true" ? { rejectUnauthorized: false } : false }) }), AuthModule, ProfilesModule], controllers: [HealthController] })
export class AppModule {}
