import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;
  private readonly basicAuth: string | undefined;
  private readonly deviceId: string | undefined;
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  readonly grupSupport: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('WA_BASE_URL') ?? 'http://localhost:3001';

    const user = this.configService.get<string>('WA_BASIC_AUTH_USER');
    const pass = this.configService.get<string>('WA_BASIC_AUTH_PASS');
    if (user && pass) {
      this.basicAuth = Buffer.from(`${user}:${pass}`).toString('base64');
    }

    this.deviceId = this.configService.get<string>('WA_DEVICE_ID');
    this.grupSupport = this.configService.get<string>('WA_GRUP_SUPPORT');
  }

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.basicAuth) {
      headers['Authorization'] = `Basic ${this.basicAuth}`;
    }
    if (this.deviceId) {
      headers['X-Device-Id'] = this.deviceId;
    }
    return headers;
  }

  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) {
      normalized = '62' + normalized.slice(1);
    }
    return `${normalized}@s.whatsapp.net`;
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (this.isDevelopment) {
      this.logger.log(
        `[DEV] WA message skipped — to: ${phone}, message: ${message}`,
      );
      return true;
    }
    const jid = this.normalizePhone(phone);
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/send/message`,
          { phone: jid, message },
          { headers: this.headers },
        ),
      );
      this.logger.log(`WA message sent to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WA message to ${phone}`, error);
      return false;
    }
  }
}
