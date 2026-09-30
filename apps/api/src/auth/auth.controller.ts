import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AuthResult, AuthUser } from '@cyberjob/shared';
import { AuthService } from './auth.service';
import {
  GoogleVerifyDto,
  LoginDto,
  RegisterDto,
  ResendLoginOtpDto,
  VerifyLoginOtpDto,
} from './dto/auth.dto';
import { REFRESH_COOKIE, type OAuthProfile, type RequestUser } from './auth.types';
import { GoogleAuthGuard, JwtAuthGuard } from './guards/guards';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** เก็บ refresh token ไว้ใน httpOnly cookie – JavaScript ฝั่งหน้าเว็บอ่านไม่ได้ */
  private setRefreshCookie(res: Response, token: string): void {
    const days = Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS') ?? 30);
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      ...this.cookieFlags(),
      path: '/api/auth',
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * ค่าเริ่มต้นเหมาะกับกรณี web กับ api อยู่โดเมนเดียวกัน
   * ถ้าแยกคนละโดเมน ให้ตั้ง COOKIE_SAMESITE=none และ COOKIE_SECURE=true (ต้องเป็น HTTPS)
   */
  private cookieFlags(): { sameSite: 'lax' | 'strict' | 'none'; secure: boolean } {
    const sameSite = (this.config.get<string>('COOKIE_SAMESITE') ??
      'lax') as 'lax' | 'strict' | 'none';
    const secureRaw = this.config.get<string>('COOKIE_SECURE');
    const secure =
      secureRaw !== undefined
        ? secureRaw === 'true'
        : process.env.NODE_ENV === 'production';
    // sameSite=none ใช้ได้เฉพาะเมื่อ secure ด้วยเท่านั้น
    return { sameSite, secure: sameSite === 'none' ? true : secure };
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      path: '/api/auth',
      ...this.cookieFlags(),
    });
  }

  /* ---------------------------------------------------------------- */
  /* สมัครสมาชิก / เข้าสู่ระบบ                                          */
  /* ---------------------------------------------------------------- */

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const { result, refreshToken } = await this.auth.register(
      dto,
      req.headers['user-agent'],
    );
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
  ) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('verify-login-otp')
  @HttpCode(200)
  async verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const code = dto.code || dto.otp || '';
    const { result, refreshToken } = await this.auth.verifyLoginOtp(
      dto.email,
      code,
      req.headers['user-agent'],
    );
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    return this.verifyLoginOtp(dto, req, res);
  }

  @Post('resend-login-otp')
  @HttpCode(200)
  async resendLoginOtp(
    @Body() dto: ResendLoginOtpDto,
  ) {
    return this.auth.resendLoginOtp(dto.email);
  }

  @Post('resend-otp')
  @HttpCode(200)
  async resendOtp(
    @Body() dto: ResendLoginOtpDto,
  ) {
    return this.auth.resendLoginOtp(dto.email);
  }

  @Post('google/verify')
  @HttpCode(200)
  async googleVerify(
    @Body() dto: GoogleVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const { result, refreshToken } = await this.auth.loginWithGoogleToken(
      dto.credential,
      dto.role,
      req.headers['user-agent'],
    );
    this.setRefreshCookie(res, refreshToken);
    return result;
  }


  /* ---------------------------------------------------------------- */
  /* refresh / logout / me                                             */
  /* ---------------------------------------------------------------- */

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResult> {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    try {
      const { result, refreshToken } = await this.auth.refresh(
        token,
        req.headers['user-agent'],
      );
      this.setRefreshCookie(res, refreshToken);
      return result;
    } catch (error) {
      this.clearRefreshCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  /** ออกจากระบบทุกอุปกรณ์ – เพิกถอน refresh token ทั้งหมดของผู้ใช้ */
  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    await this.auth.logoutAll(user.id);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser): Promise<AuthUser> {
    return this.auth.me(user.id);
  }

  /* ---------------------------------------------------------------- */
  /* OAuth 2.0 – Google                                                */
  /* ---------------------------------------------------------------- */

  /** พาไปหน้ายินยอมของ Google */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // passport เป็นคนพา redirect ให้เอง
  }

  /**
   * Google เรียกกลับมาที่นี่ → ออก token แล้วส่งผู้ใช้กลับไปหน้าเว็บ
   * access token ถูกแนบไปกับ URL เพื่อให้หน้า /auth/callback เก็บต่อ
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as unknown as OAuthProfile;
    const { result, refreshToken } = await this.auth.loginWithOAuth(
      profile,
      req.headers['user-agent'],
    );
    this.setRefreshCookie(res, refreshToken);

    const target =
      this.config.get<string>('OAUTH_SUCCESS_REDIRECT') ??
      'http://localhost:3000/auth/callback';
    const url = new URL(target);
    url.searchParams.set('accessToken', result.accessToken);
    url.searchParams.set('expiresIn', String(result.expiresIn));

    res.redirect(url.toString());
  }
}
