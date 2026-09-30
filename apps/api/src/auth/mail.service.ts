import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.isConfigured = true;
      this.logger.log(`SMTP configured for ${user}@${host}:${port}`);
    } else {
      this.isConfigured = false;
      this.logger.warn('SMTP is not configured. OTP codes will be logged to console.');
    }
  }

  async sendOtpEmail(to: string, otpCode: string, type: string = 'LOGIN_2FA'): Promise<boolean> {
    const subject = type === 'LOGIN_2FA' 
      ? `[CyberJob] รหัสยืนยันเข้าสู่ระบบ (OTP): ${otpCode}`
      : `[CyberJob] รหัสยืนยันของคุณ: ${otpCode}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>รหัสยืนยัน OTP - CyberJob</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
    <tr>
      <td style="background: linear-gradient(135deg, #0d1b2a, #1b263b); padding: 28px 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">CYBER<span style="color: #3b82f6;">JOB</span></h1>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">ระบบยืนยันตัวตนความปลอดภัย 2 ชั้น (2FA)</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 24px 32px;">
        <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">รหัสยืนยันเข้าสู่ระบบของคุณ</h2>
        <p style="color: #475569; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">
          มีคำขอเข้าสู่ระบบบัญชี <strong>${to}</strong><br>
          กรุณานำรหัส OTP 6 หลักด้านล่างนี้ไปกรอกในหน้าต่างเข้าสู่ระบบ:
        </p>

        <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px;">${otpCode}</span>
          <div style="color: #64748b; font-size: 12px; margin-top: 8px;">รหัสมีอายุการใช้งาน 5 นาที</div>
        </div>

        <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5;">
          * หากคุณไม่ได้เป็นผู้ทำรายการนี้ โปรดอย่าให้รหัสนี้แก่ผู้อื่นเพื่อความปลอดภัยของบัญชีของคุณ
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; CyberJob Official. แพลตฟอร์มงานไอทีและความปลอดภัยไซเบอร์</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    this.logger.log(`\n========================================\n[OTP EMAIL] To: ${to} | Code: ${otpCode} | Type: ${type}\n========================================`);

    if (this.transporter && this.isConfigured) {
      try {
        const from = this.config.get<string>('SMTP_FROM') || `"CyberJob" <${this.config.get<string>('SMTP_USER')}>`;
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html: htmlContent,
          text: `รหัสยืนยันเข้าสู่ระบบ CyberJob (OTP) ของคุณคือ: ${otpCode} (รหัสหมดอายุใน 5 นาที)`,
        });
        this.logger.log(`OTP email sent successfully to ${to}`);
        return true;
      } catch (err) {
        this.logger.error(`Failed to send email via SMTP to ${to}: ${err instanceof Error ? err.message : String(err)}`);
        return false;
      }
    }

    return true;
  }
}
