import {
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';

/** ต้องล็อกอินเท่านั้น */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * ล็อกอินหรือไม่ก็ได้ – ถ้ามี token ที่ถูกต้องจะได้ request.user
 * ใช้กับ endpoint ที่แสดงผลต่างกันเมื่อล็อกอิน
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return (user ?? undefined) as TUser;
  }
}

/** ป้องกันไม่ให้ล้มแบบงง ๆ เมื่อยังไม่ได้ตั้งค่า Google OAuth */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (!this.config.get<string>('GOOGLE_CLIENT_ID')) {
      throw new NotImplementedException(
        'ยังไม่ได้ตั้งค่า Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)',
      );
    }
    return super.canActivate(context);
  }
}
