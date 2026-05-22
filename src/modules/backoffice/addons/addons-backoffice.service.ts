import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { SubscriptionAddonEntity } from './entities/subscription-addon.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { PaymentAttemptEntity } from '../payments/entities/payment-attempt.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { t } from '../../../constant/messages';

type AddonListFilter = PaginationDto & {
  status?: string;
  type?: string;
};

function toResponse(a: SubscriptionAddonEntity) {
  return {
    id: a.id,
    tenant_id: a.tenantId,
    tenant_name: a.tenant?.name ?? null,
    subscription_id: a.subscriptionId,
    type: a.type,
    quantity: a.quantity,
    unit_price: a.unitPrice,
    prorated_months: a.proratedMonths,
    amount: a.amount,
    status: a.status,
    activated_at: a.activatedAt ? a.activatedAt.toISOString() : null,
    expires_at: a.expiresAt ? a.expiresAt.toISOString() : null,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  };
}

@Injectable()
export class AddonsBackofficeService {
  constructor(
    @InjectRepository(SubscriptionAddonEntity)
    private readonly addonRepository: Repository<SubscriptionAddonEntity>,
    @InjectRepository(PaymentAttemptEntity)
    private readonly paymentAttemptRepository: Repository<PaymentAttemptEntity>,
  ) {}

  async findAll(filter: AddonListFilter) {
    const { page = 1, limit = 10, keyword = '', status, type } = filter;
    const skip = (page - 1) * limit;

    const baseWhere: Record<string, unknown> = {};
    if (status) baseWhere.status = status;
    if (type) baseWhere.type = type;

    const where = keyword
      ? [{ ...baseWhere, tenant: { name: ILike(`%${keyword}%`) } }]
      : baseWhere;

    const [rows, total] = await this.addonRepository.findAndCount({
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
    const row = await this.addonRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
    if (!row) throw new NotFoundException(t('addon_not_found'));
    return toResponse(row);
  }

  async cancel(id: string) {
    const addon = await this.addonRepository.findOne({ where: { id } });
    if (!addon) throw new NotFoundException(t('addon_not_found'));
    if (addon.status !== 'pending') {
      throw new BadRequestException(
        'Hanya add-on dengan status pending yang bisa dibatalkan',
      );
    }

    await this.addonRepository.manager.transaction(async (manager) => {
      await manager.update(
        SubscriptionAddonEntity,
        { id },
        { status: 'cancelled' },
      );
      await manager.update(
        PaymentAttemptEntity,
        { addonId: id, status: 'pending' },
        { status: 'failed' },
      );
    });

    return { addon_id: id, status: 'cancelled' };
  }

  async remove(id: string) {
    const addon = await this.addonRepository.findOne({ where: { id } });
    if (!addon) throw new NotFoundException(t('addon_not_found'));

    await this.addonRepository.manager.transaction(async (manager) => {
      if (addon.status === 'active') {
        const tenant = await manager.findOne(TenantEntity, {
          where: { id: addon.tenantId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!tenant) throw new NotFoundException(t('tenant_not_found'));

        const quotaPatch: Partial<TenantEntity> = {};
        if (addon.type === 'add_user') {
          quotaPatch.userQuota = Math.max(0, tenant.userQuota - addon.quantity);
        } else if (addon.type === 'add_branch') {
          quotaPatch.branchQuota = Math.max(
            0,
            tenant.branchQuota - addon.quantity,
          );
        }
        if (Object.keys(quotaPatch).length > 0) {
          await manager.update(TenantEntity, tenant.id, quotaPatch);
        }
      }

      await manager.delete(PaymentAttemptEntity, { addonId: id });
      await manager.delete(SubscriptionAddonEntity, { id });
    });

    return { addon_id: id, deleted: true };
  }
}
