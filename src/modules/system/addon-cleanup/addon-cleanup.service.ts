import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { SubscriptionAddonEntity } from '../../backoffice/addons/entities/subscription-addon.entity';
import { PaymentAttemptEntity } from '../../backoffice/payments/entities/payment-attempt.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';

@Injectable()
export class AddonCleanupService {
  private readonly logger = new Logger(AddonCleanupService.name);
  private readonly pendingTtlHours = 6;

  constructor(
    @InjectRepository(SubscriptionAddonEntity)
    private readonly addonRepository: Repository<SubscriptionAddonEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cancelStalePendingAddons() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - this.pendingTtlHours);

    await this.addonRepository.manager.transaction(async (manager) => {
      const stale = await manager.find(SubscriptionAddonEntity, {
        where: { status: 'pending', createdAt: LessThan(cutoff) },
        select: ['id'],
      });
      if (!stale.length) return;

      const ids = stale.map((a) => a.id);

      await manager
        .createQueryBuilder()
        .update(PaymentAttemptEntity)
        .set({ status: 'failed' })
        .where('addon_id IN (:...ids) AND status = :status', {
          ids,
          status: 'pending',
        })
        .execute();

      await manager
        .createQueryBuilder()
        .update(SubscriptionAddonEntity)
        .set({ status: 'cancelled' })
        .where('id IN (:...ids)', { ids })
        .execute();

      this.logger.warn(
        `Auto-cancel ${ids.length} add-on pending (>${this.pendingTtlHours} jam)`,
      );
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireActiveAddons() {
    const now = new Date();

    await this.addonRepository.manager.transaction(async (manager) => {
      const expired = await manager.find(SubscriptionAddonEntity, {
        where: { status: 'active', expiresAt: LessThanOrEqual(now) },
        select: ['id', 'tenantId', 'type', 'quantity'],
      });
      if (!expired.length) return;

      for (const addon of expired) {
        const tenant = await manager.findOne(TenantEntity, {
          where: { id: addon.tenantId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!tenant) continue;

        const patch: Partial<TenantEntity> = {};
        if (addon.type === 'add_user') {
          patch.userQuota = Math.max(1, tenant.userQuota - addon.quantity);
        } else if (addon.type === 'add_branch') {
          patch.branchQuota = Math.max(1, tenant.branchQuota - addon.quantity);
        }
        if (Object.keys(patch).length > 0) {
          await manager.update(TenantEntity, tenant.id, patch);
        }

        await manager.update(SubscriptionAddonEntity, addon.id, {
          status: 'expired',
        });
      }

      this.logger.log(`Expired ${expired.length} add-on aktif`);
    });
  }
}
