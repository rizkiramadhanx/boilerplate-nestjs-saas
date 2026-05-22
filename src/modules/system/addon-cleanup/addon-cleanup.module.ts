import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionAddonEntity } from '../../backoffice/addons/entities/subscription-addon.entity';
import { PaymentAttemptEntity } from '../../backoffice/payments/entities/payment-attempt.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { AddonCleanupService } from './addon-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionAddonEntity,
      PaymentAttemptEntity,
      TenantEntity,
    ]),
  ],
  providers: [AddonCleanupService],
})
export class AddonCleanupModule {}
