import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, MoreThan, Repository } from 'typeorm';
import { PaymentAttemptEntity } from './entities/payment-attempt.entity';
import { PaymentWebhookLogEntity } from './entities/payment-webhook-log.entity';
import { SubscriptionEntity } from '../subscriptions/entities/subscription.entity';
import { PricingConfigEntity } from '../pricing/entities/pricing-config.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { SubscriptionAddonEntity } from '../addons/entities/subscription-addon.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { AuthService } from '../../app/auth/auth.service';
import { t } from '../../../constant/messages';

function endOfDayWib(start: Date, addMonths: number): Date {
  const d = new Date(start);
  d.setMonth(d.getMonth() + addMonths);
  // set ke 23:59:59 WIB (UTC+7)
  d.setUTCHours(16, 59, 59, 999);
  return d;
}

type PaymentListFilter = PaginationDto & {
  status?: string;
};

function toResponse(p: PaymentAttemptEntity) {
  return {
    id: p.id,
    tenant_id: p.tenantId,
    tenant_name: p.tenant?.name ?? null,
    subscription_id: p.subscriptionId,
    subscription_plan: p.subscription?.plan ?? null,
    order_id: p.orderId,
    provider: p.provider,
    project_slug: p.projectSlug,
    amount: p.amount,
    payment_url: p.paymentUrl ?? null,
    status: p.status,
    paid_at: p.paidAt ? p.paidAt.toISOString() : null,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class PaymentsBackofficeService {
  constructor(
    @InjectRepository(PaymentAttemptEntity)
    private readonly paymentRepository: Repository<PaymentAttemptEntity>,
    @InjectRepository(PaymentWebhookLogEntity)
    private readonly webhookLogRepository: Repository<PaymentWebhookLogEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(PricingConfigEntity)
    private readonly pricingRepository: Repository<PricingConfigEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(SubscriptionAddonEntity)
    private readonly addonRepository: Repository<SubscriptionAddonEntity>,
    private readonly authService: AuthService,
  ) {}

  async findAll(filter: PaymentListFilter) {
    const { page = 1, limit = 10, keyword = '', status } = filter;
    const skip = (page - 1) * limit;

    const baseWhere: Record<string, unknown> = {};
    if (status) {
      baseWhere.status = status;
    }
    const where = keyword
      ? [
          { ...baseWhere, orderId: ILike(`%${keyword}%`) },
          {
            ...baseWhere,
            tenant: { name: ILike(`%${keyword}%`) },
          },
        ]
      : baseWhere;

    const [rows, total] = await this.paymentRepository.findAndCount({
      where,
      relations: ['tenant', 'subscription'],
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
    const row = await this.paymentRepository.findOne({
      where: { id },
      relations: ['tenant', 'subscription'],
    });
    if (!row) throw new NotFoundException(t('payment_not_found'));
    return {
      ...toResponse(row),
      raw_response: row.rawResponse ?? null,
    };
  }

  async validate(id: string) {
    const row = await this.paymentRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException(t('payment_not_found'));
    return this.authService.adminCheckPakasirPaymentStatus(row.orderId);
  }

  async markAsPaid(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['subscription'],
    });
    if (!payment) throw new NotFoundException(t('payment_not_found'));
    if (payment.status === 'paid') {
      throw new BadRequestException('Payment sudah berstatus paid');
    }

    const now = new Date();
    const manualRaw = {
      source: 'manual',
      marked_by: 'backoffice_admin',
      marked_at: now.toISOString(),
    };

    if (payment.purpose === 'addon') {
      await this._markAddonPaid(payment, now, manualRaw);
    } else {
      await this._markSubscriptionPaid(payment, now, manualRaw);
    }

    return { ok: true, activated: true };
  }

  private async _markSubscriptionPaid(
    payment: PaymentAttemptEntity & { subscription: SubscriptionEntity },
    now: Date,
    manualRaw: Record<string, unknown>,
  ) {
    const pricing = await this.pricingRepository.findOne({
      where: { plan: payment.subscription.plan, isActive: true },
    });
    if (!pricing)
      throw new BadRequestException(t('subscription_plan_unavailable'));

    await this.paymentRepository.manager.transaction(async (manager) => {
      const tenant = await manager.findOne(TenantEntity, {
        where: { id: payment.tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tenant) throw new NotFoundException(t('tenant_not_found'));

      const latestActive = await manager.findOne(SubscriptionEntity, {
        where: {
          tenantId: payment.tenantId,
          status: 'active',
          periodEnd: MoreThan(now),
        },
        order: { periodEnd: 'DESC' },
      });

      const startsActive = !latestActive;
      const periodStart = latestActive?.periodEnd
        ? new Date(latestActive.periodEnd)
        : new Date(now);
      const periodEnd = endOfDayWib(periodStart, pricing.periodMonths);

      await manager.update(PaymentAttemptEntity, payment.id, {
        status: 'paid',
        paidAt: now,
        rawResponse: manualRaw,
      });
      await manager.update(SubscriptionEntity, payment.subscriptionId, {
        status: 'active',
        paidAt: now,
        periodStart,
        periodEnd,
        isTrial: false,
      });

      const existingEnd = tenant.currentPeriodEnd
        ? new Date(tenant.currentPeriodEnd)
        : null;
      const newChainEnd =
        existingEnd && existingEnd.getTime() > periodEnd.getTime()
          ? existingEnd
          : periodEnd;
      const tenantPatch: Partial<TenantEntity> = {
        status: 'active',
        currentPeriodEnd: newChainEnd,
        trialEndsAt: null,
      };
      if (startsActive) {
        tenantPatch.plan = payment.subscription.plan;
        tenantPatch.userQuota = payment.subscription.userQuota;
        tenantPatch.branchQuota = payment.subscription.branchQuota;
        tenantPatch.currentPeriodStart = periodStart;
      }
      await manager.update(TenantEntity, payment.tenantId, tenantPatch);

      await manager.save(PaymentWebhookLogEntity, {
        orderId: payment.orderId,
        paymentAttemptId: payment.id,
        rawBody: manualRaw,
        status: 'processed' as const,
        notes: 'marked as paid manually by backoffice admin',
        processedAt: now,
      });
    });
  }

  private async _markAddonPaid(
    payment: PaymentAttemptEntity,
    now: Date,
    manualRaw: Record<string, unknown>,
  ) {
    if (!payment.addonId)
      throw new BadRequestException(t('payment_attempt_not_for_addon'));

    const addon = await this.addonRepository.findOne({
      where: { id: payment.addonId },
    });
    if (!addon) throw new NotFoundException(t('addon_not_found'));

    await this.paymentRepository.manager.transaction(async (manager) => {
      const tenant = await manager.findOne(TenantEntity, {
        where: { id: addon.tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tenant) throw new NotFoundException(t('tenant_not_found'));

      await manager.update(PaymentAttemptEntity, payment.id, {
        status: 'paid',
        paidAt: now,
        rawResponse: manualRaw,
      });
      await manager.update(SubscriptionAddonEntity, addon.id, {
        status: 'active',
        activatedAt: now,
      });

      const quotaPatch: Partial<TenantEntity> = {};
      if (addon.type === 'add_user')
        quotaPatch.userQuota = tenant.userQuota + addon.quantity;
      else if (addon.type === 'add_branch')
        quotaPatch.branchQuota = tenant.branchQuota + addon.quantity;
      if (Object.keys(quotaPatch).length > 0) {
        await manager.update(TenantEntity, tenant.id, quotaPatch);
      }

      await manager.save(PaymentWebhookLogEntity, {
        orderId: payment.orderId,
        paymentAttemptId: payment.id,
        rawBody: manualRaw,
        status: 'processed' as const,
        notes: 'addon marked as paid manually by backoffice admin',
        processedAt: now,
      });
    });
  }
}
