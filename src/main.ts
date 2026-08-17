import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
async function bootstrap() { const app = await NestFactory.create(AppModule); app.setGlobalPrefix("api/v1"); app.enableCors({ origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"], credentials: true }); app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true })); await app.listen(Number(process.env.PORT ?? 3003), "0.0.0.0"); }
void bootstrap();
