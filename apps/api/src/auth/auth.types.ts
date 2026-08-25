import type { AuthUser } from '@cyberjob/shared';

/** payload ที่ฝังใน access token */
export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
}

/** ข้อมูลผู้ใช้ที่ guard แนบไว้บน request */
export interface RequestUser {
  id: string;
  email: string;
  role: AuthUser['role'];
}

/** โปรไฟล์ที่ได้จาก Google OAuth */
export interface OAuthProfile {
  provider: 'GOOGLE';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export const REFRESH_COOKIE = 'cyberjob_refresh';
