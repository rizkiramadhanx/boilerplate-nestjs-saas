import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionEntity } from '../../backoffice/subscriptions/entities/subscription.entity';
import { PaymentAttemptEntity } from '../../backoffice/payments/entities/payment-attempt.entity';
import { SubscriptionAddonEntity } from '../../backoffice/addons/entities/subscription-addon.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { SubscriptionCleanupService } from './subscription-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionEntity,
      PaymentAttemptEntity,
      SubscriptionAddonEntity,
      TenantEntity,
    ]),
  ],
  providers: [SubscriptionCleanupService],
})
export class SubscriptionCleanupModule {}
