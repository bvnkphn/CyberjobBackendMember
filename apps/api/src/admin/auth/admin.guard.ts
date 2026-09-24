import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import type { RequestUser } from "../../auth/auth.types";

/**
 * ต้องมี access token ที่ถูกต้อง และผู้ใช้ในฐานข้อมูลต้องยังเป็น ADMIN อยู่
 * อ่าน role จากฐานข้อมูลทุกครั้ง ไม่เชื่อค่าใน token อย่างเดียว
 * เพราะ token อายุ 15 นาทีอาจยังใช้ได้อยู่หลังถูกถอดสิทธิ์
 */
@Injectable()
export class AdminGuard extends AuthGuard("jwt") implements CanActivate {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      throw new UnauthorizedException("กรุณาเข้าสู่ระบบ");
    }

    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const account = request.user
      ? await this.prisma.user.findUnique({ where: { id: request.user.id }, select: { role: true } })
      : null;

    if (!account) throw new UnauthorizedException("ไม่พบบัญชีผู้ใช้");
    if (account.role !== "ADMIN") throw new ForbiddenException("เฉพาะผู้ดูแลระบบเท่านั้น");
    return true;
  }
}
