import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import type { RequestUser } from "./jwt.strategy";

export interface OwnerContext {
  userId: string;
  email: string;
  name: string;
  /** null = ยังไม่ได้กรอกข้อมูลบริษัทในหน้า Gate */
  companyId: string | null;
}

type OwnerRequest = Request & { user?: RequestUser; owner?: OwnerContext };

/**
 * ต้องมี access token ที่ถูกต้อง และผู้ใช้ในฐานข้อมูลต้องยังเป็น EMPLOYER อยู่
 * อ่าน role จากฐานข้อมูลทุกครั้ง ไม่เชื่อค่าใน token อย่างเดียว
 */
@Injectable()
export class OwnerGuard extends AuthGuard("jwt") implements CanActivate {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      throw new UnauthorizedException("กรุณาเข้าสู่ระบบ");
    }

    const request = context.switchToHttp().getRequest<OwnerRequest>();
    const account = request.user
      ? await this.prisma.user.findUnique({
          where: { id: request.user.id },
          select: { id: true, email: true, name: true, role: true, ownedCompany: { select: { id: true } } },
        })
      : null;

    if (!account) throw new UnauthorizedException("ไม่พบบัญชีผู้ใช้");
    if (account.role !== "EMPLOYER") throw new ForbiddenException("เฉพาะบัญชีผู้ประกอบการเท่านั้น");

    request.owner = {
      userId: account.id,
      email: account.email,
      name: account.name,
      companyId: account.ownedCompany?.id ?? null,
    };
    return true;
  }
}

export const CurrentOwner = createParamDecorator((_data: unknown, context: ExecutionContext): OwnerContext => {
  const request = context.switchToHttp().getRequest<OwnerRequest>();
  if (!request.owner) throw new UnauthorizedException("กรุณาเข้าสู่ระบบ");
  return request.owner;
});
