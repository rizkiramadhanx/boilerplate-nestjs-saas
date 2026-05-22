import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mailer.service';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async sendTest(@Body() body: { to?: string; name?: string; link?: string }) {
    const to = body?.to || 'rizkijitu77@gmail.com';
    const name = body?.name || 'Rizki';
    const link = body?.link || 'https://example.com/confirm?code=test-token';
    await this.mailService.sendVerificationEmail(to, name, link);
    return { ok: true, to };
  }
}
