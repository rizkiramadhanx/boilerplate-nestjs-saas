import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { SubscriptionEntity } from '../../backoffice/subscriptions/entities/subscription.entity';
import { PaymentAttemptEntity } from '../../backoffice/payments/entities/payment-attempt.entity';
import { SubscriptionAddonEntity } from '../../backoffice/addons/entities/subscription-addon.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';

const DEFAULT_USER_QUOTA = 2;
const DEFAULT_BRANCH_QUOTA = 1;

@Injectable()
export class SubscriptionCleanupService {
  private readonly logger = new Logger(SubscriptionCleanupService.name);
  private readonly pendingTtlHours = 6;

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cancelStalePendingSubscriptions() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.pendingTtlHours);

    await this.subscriptionRepository.manager.transaction(async (manager) => {
      const stale = await manager.find(SubscriptionEntity, {
        where: { status: 'pending', createdAt: LessThan(cutoff) },
        select: ['id'],
      });
      if (!stale.length) return;

      const ids = stale.map((s) => s.id);

      await manager
        .createQueryBuilder()
        .update(PaymentAttemptEntity)
        .set({ status: 'failed' })
        .where('subscription_id IN (:...ids) AND status = :status', {
          ids,
          status: 'pending',
        })
        .execute();

      await manager
        .createQueryBuilder()
        .update(SubscriptionEntity)
        .set({ status: 'cancelled' })
        .where('id IN (:...ids)', { ids })
        .execute();

      this.logger.warn(
        `Auto-cancel ${ids.length} subscription pending (>${this.pendingTtlHours} jam)`,
      );
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireEndedSubscriptions() {
    const now = new Date();

    await this.subscriptionRepository.manager.transaction(async (manager) => {
      const expired = await manager.find(SubscriptionEntity, {
        where: { status: 'active', periodEnd: LessThan(now) },
        select: ['id', 'tenantId'],
      });
      if (!expired.length) return;

      const ids = expired.map((s) => s.id);
      const tenantIds = Array.from(new Set(expired.map((s) => s.tenantId)));

      await manager
        .createQueryBuilder()
        .update(SubscriptionEntity)
        .set({ status: 'expired' })
        .where('id IN (:...ids)', { ids })
        .execute();

      await manager
        .createQueryBuilder()
        .update(SubscriptionAddonEntity)
        .set({ status: 'expired' })
        .where('subscription_id IN (:...ids) AND status = :status', {
          ids,
          status: 'active',
        })
        .execute();

      for (const tenantId of tenantIds) {
        const remainingActive = await manager.count(SubscriptionEntity, {
          where: {
            tenantId,
            status: 'active',
            periodEnd: MoreThan(now),
          },
        });
        if (remainingActive > 0) continue;

        await manager.update(TenantEntity, tenantId, {
          status: 'expired',
          plan: undefined,
          currentPeriodStart: undefined,
          currentPeriodEnd: undefined,
          userQuota: DEFAULT_USER_QUOTA,
          branchQuota: DEFAULT_BRANCH_QUOTA,
        });
      }

      this.logger.warn(
        `Auto-expire ${ids.length} subscription berakhir; reset ${tenantIds.length} tenant ke default`,
      );
    });
  }
}
