import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { MailModule } from '../../app/mailer/mailer.module';
import { SubscriptionExpiryReminderService } from './subscription-expiry-reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity]), MailModule],
  providers: [SubscriptionExpiryReminderService],
})
export class SubscriptionExpiryReminderModule {}
