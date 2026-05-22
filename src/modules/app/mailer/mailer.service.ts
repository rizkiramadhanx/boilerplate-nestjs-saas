import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  private readonly appName: string;

  constructor(
    private readonly mailService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.appName =
      this.configService.get<string>('MAIL_FROM_NAME') ?? 'Kasir Agen';
  }

  async sendVerificationEmail(
    to: string,
    username: string,
    confirmationLink: string,
  ): Promise<boolean> {
    if (this.isDevelopment) {
      console.log(
        `[DEV] Verification email skipped for ${to} — link: ${confirmationLink}`,
      );
      return true;
    }
    try {
      await this.mailService.sendMail({
        to,
        subject: `Verifikasi Email ${this.appName}`,
        template: './email-verification',
        context: { username, confirmationLink, appName: this.appName },
      });
      console.log(`Verification email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`Error sending verification email to ${to}:`, error);
      throw new Error(`Failed to send verification email to ${to}`);
    }
  }

  async sendPasswordResetEmail(
    to: string,
    username: string,
    resetLink: string,
  ): Promise<boolean> {
    if (this.isDevelopment) {
      console.log(
        `[DEV] Password reset email skipped for ${to} — link: ${resetLink}`,
      );
      return true;
    }
    try {
      await this.mailService.sendMail({
        to,
        subject: `Reset Password ${this.appName}`,
        template: './password-reset',
        context: { username, resetLink, appName: this.appName },
      });
      console.log(`Password reset email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`Error sending password reset email to ${to}:`, error);
      throw new Error(`Failed to send password reset email to ${to}`);
    }
  }

  async sendPaymentSuccessEmail(
    to: string,
    context: {
      ownerName: string;
      plan: string;
      amount: string;
      periodEnd: string;
      userQuota: number;
      branchQuota: number;
    },
  ): Promise<void> {
    if (this.isDevelopment) {
      console.log(`[DEV] Payment success email skipped for ${to}`, context);
      return;
    }
    try {
      await this.mailService.sendMail({
        to,
        subject: `Pembayaran Berhasil - ${this.appName}`,
        template: './payment-success',
        context: { ...context, appName: this.appName },
      });
      console.log(`Payment success email sent to ${to}`);
    } catch (error) {
      console.error(`Error sending payment success email to ${to}:`, error);
    }
  }

  async sendBirthdayEmail(
    to: string,
    nama: string,
    usia: number | null,
  ): Promise<void> {
    if (this.isDevelopment) {
      console.log(
        `[DEV] Birthday email skipped for ${to} (${nama}, ${usia} tahun)`,
      );
      return;
    }
    try {
      await this.mailService.sendMail({
        to,
        subject: `Selamat Ulang Tahun, ${nama}! 🎂`,
        template: './birthday',
        context: { nama, usia, appName: this.appName },
      });
      console.log(`Birthday email sent to ${to}`);
    } catch (error) {
      console.error(`Error sending birthday email to ${to}:`, error);
      throw error;
    }
  }

  async sendExpiryReminderEmail(
    to: string,
    context: {
      ownerName: string;
      plan: string;
      periodEnd: string;
      daysLeft: number;
      renewLink: string;
    },
  ): Promise<void> {
    if (this.isDevelopment) {
      console.log(`[DEV] Expiry reminder email skipped for ${to}`, context);
      return;
    }
    try {
      await this.mailService.sendMail({
        to,
        subject: `Langganan kamu berakhir ${context.daysLeft} hari lagi - ${this.appName}`,
        template: './subscription-expiry-reminder',
        context: { ...context, appName: this.appName },
      });
      console.log(
        `Expiry reminder email sent to ${to} (${context.daysLeft} days left)`,
      );
    } catch (error) {
      console.error(`Error sending expiry reminder email to ${to}:`, error);
    }
  }
}
