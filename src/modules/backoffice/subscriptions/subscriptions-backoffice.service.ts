import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { SubscriptionEntity } from './entities/subscription.entity';
import { PaymentAttemptEntity } from '../payments/entities/payment-attempt.entity';
import { SubscriptionAddonEntity } from '../addons/entities/subscription-addon.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { t } from '../../../constant/messages';

type SubscriptionListFilter = PaginationDto & {
  status?: string;
};

function toResponse(s: SubscriptionEntity) {
  return {
    id: s.id,
    tenant_id: s.tenantId,
    tenant_name: s.tenant?.name ?? null,
    plan: s.plan,
    status: s.status,
    amount: s.amount,
    user_quota: s.userQuota,
    branch_quota: s.branchQuota,
    period_start: s.periodStart ? s.periodStart.toISOString() : null,
    period_end: s.periodEnd ? s.periodEnd.toISOString() : null,
    is_trial: s.isTrial,
    paid_at: s.paidAt ? s.paidAt.toISOString() : null,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  };
}

@Injectable()
export class SubscriptionsBackofficeService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(PaymentAttemptEntity)
    private readonly paymentAttemptRepository: Repository<PaymentAttemptEntity>,
  ) {}

  async findAll(filter: SubscriptionListFilter) {
    const { page = 1, limit = 10, keyword = '', status } = filter;
    const skip = (page - 1) * limit;

    const baseWhere: Record<string, unknown> = {};
    if (status) baseWhere.status = status;

    const where = keyword
      ? [{ ...baseWhere, tenant: { name: ILike(`%${keyword}%`) } }]
      : baseWhere;

    const [rows, total] = await this.subscriptionRepository.findAndCount({
      where,
      relations: ['tenant'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: Math.ceil(total / limit),
    };
    return { data: rows.map(toResponse), meta };
  }

  async findOne(id: string) {
    const row = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
    if (!row) throw new NotFoundException(t('subscription_not_found'));
    return toResponse(row);
  }

  async cancel(id: string) {
    const sub = await this.subscriptionRepository.findOne({ where: { id } });
    if (!sub) throw new NotFoundException(t('subscription_not_found'));
    if (sub.status !== 'pending') {
      throw new BadRequestException(
        'Hanya langganan dengan status pending yang bisa dibatalkan',
      );
    }

    await this.subscriptionRepository.manager.transaction(async (manager) => {
      await manager.update(SubscriptionEntity, { id }, { status: 'cancelled' });
      await manager.update(
        PaymentAttemptEntity,
        { subscriptionId: id, status: 'pending' },
        { status: 'failed' },
      );
    });

    return { subscription_id: id, status: 'cancelled' };
  }

  async remove(id: string) {
    const sub = await this.subscriptionRepository.findOne({ where: { id } });
    if (!sub) throw new NotFoundException(t('subscription_not_found'));

    await this.subscriptionRepository.manager.transaction(async (manager) => {
      if (sub.status === 'active') {
        const tenant = await manager.findOne(TenantEntity, {
          where: { id: sub.tenantId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!tenant) throw new NotFoundException(t('tenant_not_found'));

        const activeAddons = await manager.find(SubscriptionAddonEntity, {
          where: { subscriptionId: id, status: 'active' },
        });
        let userQuotaReduction = 0;
        let branchQuotaReduction = 0;
        for (const a of activeAddons) {
          if (a.type === 'add_user') userQuotaReduction += a.quantity;
          else if (a.type === 'add_branch') branchQuotaReduction += a.quantity;
        }

        const now = new Date();
        const otherActiveSubs = await manager.find(SubscriptionEntity, {
          where: {
            tenantId: sub.tenantId,
            status: 'active',
            id: Not(id),
          },
        });
        const remainingActive = otherActiveSubs.filter(
          (s) => s.periodEnd && s.periodEnd.getTime() > now.getTime(),
        );

        const tenantPatch: Partial<TenantEntity> = {};
        if (remainingActive.length === 0) {
          tenantPatch.status = 'expired';
          tenantPatch.plan = undefined;
          tenantPatch.currentPeriodStart = undefined;
          tenantPatch.currentPeriodEnd = undefined;
        } else {
          const latestEnd = remainingActive.reduce<Date>(
            (max, s) => (s.periodEnd! > max ? s.periodEnd! : max),
            remainingActive[0].periodEnd!,
          );
          tenantPatch.currentPeriodEnd = latestEnd;
          if (userQuotaReduction > 0) {
            tenantPatch.userQuota = Math.max(
              0,
              tenant.userQuota - userQuotaReduction,
            );
          }
          if (branchQuotaReduction > 0) {
            tenantPatch.branchQuota = Math.max(
              0,
              tenant.branchQuota - branchQuotaReduction,
            );
          }
        }

        await manager.update(TenantEntity, tenant.id, tenantPatch);

        if (activeAddons.length > 0) {
          const addonIds = activeAddons.map((a) => a.id);
          await manager
            .createQueryBuilder()
            .update(SubscriptionAddonEntity)
            .set({ status: 'cancelled' })
            .where('id IN (:...addonIds)', { addonIds })
            .execute();
        }
      }

      await manager.delete(PaymentAttemptEntity, { subscriptionId: id });
      await manager.delete(SubscriptionEntity, { id });
    });

    return { subscription_id: id, deleted: true };
  }
}
