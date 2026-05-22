import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { MailService } from '../../app/mailer/mailer.service';

const RENEW_LINK = 'https://kasiragen.kubikcreative.com/subscription';

@Injectable()
export class SubscriptionExpiryReminderService {
  private readonly logger = new Logger(SubscriptionExpiryReminderService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    private readonly mailService: MailService,
  ) {}

  // Jam 10.00 WIB = 03.00 UTC
  @Cron('0 3 * * *')
  async sendExpiryReminders() {
    await this.sendActiveRemindersForDays(7);
    await this.sendActiveRemindersForDays(3);
    await this.sendActiveRemindersForDays(1);
    await this.sendTrialRemindersForDays(3);
    await this.sendTrialRemindersForDays(1);
  }

  private buildDateRange(daysFromNow: number): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() + daysFromNow);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  }

  private async sendActiveRemindersForDays(daysLeft: number) {
    const { start, end } = this.buildDateRange(daysLeft);

    const tenants = await this.tenantRepository.find({
      where: {
        status: 'active',
        currentPeriodEnd: Between(start, end),
      },
      select: [
        'id',
        'ownerName',
        'ownerEmail',
        'ownerPhone',
        'plan',
        'currentPeriodEnd',
      ],
    });

    if (!tenants.length) return;

    this.logger.log(
      `Sending active ${daysLeft}-day expiry reminders to ${tenants.length} tenants`,
    );

    for (const tenant of tenants) {
      const formatted = this.formatDate(tenant.currentPeriodEnd!);

      await this.mailService
        .sendExpiryReminderEmail(tenant.ownerEmail, {
          ownerName: tenant.ownerName,
          plan: tenant.plan ?? '-',
          periodEnd: formatted,
          daysLeft,
          renewLink: RENEW_LINK,
        })
        .catch((err) =>
          this.logger.error(
            `Failed to send email reminder to ${tenant.ownerEmail}`,
            err,
          ),
        );

      // if (tenant.ownerPhone) {
      //   const message =
      //     `Halo *${tenant.ownerName}*,\n\n` +
      //     `Langganan *${tenant.plan ?? '-'}* Anda akan berakhir dalam *${daysLeft} hari* (${formatted}).\n\n` +
      //     `Segera perpanjang agar akses Anda tidak terputus:\n${RENEW_LINK}\n\n` +
      //     `Terima kasih. 🙏`;
      //   await this.whatsappService
      //     .sendMessage(tenant.ownerPhone, message)
      //     .catch((err) =>
      //       this.logger.error(
      //         `Failed to send WA reminder to ${tenant.ownerPhone}`,
      //         err,
      //       ),
      //     );
      // }
    }
  }

  private async sendTrialRemindersForDays(daysLeft: number) {
    const { start, end } = this.buildDateRange(daysLeft);

    const tenants = await this.tenantRepository.find({
      where: {
        status: 'trial',
        trialEndsAt: Between(start, end),
      },
      select: ['id', 'ownerName', 'ownerEmail', 'ownerPhone', 'trialEndsAt'],
    });

    if (!tenants.length) return;

    this.logger.log(
      `Sending trial ${daysLeft}-day expiry reminders to ${tenants.length} tenants`,
    );

    // WA reminder trial di-comment sementara
  }
}
