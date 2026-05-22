import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { PricingConfigEntity } from './entities/pricing-config.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { CreatePricingBackofficeDto } from './dto/create-pricing-backoffice.dto';
import { UpdatePricingBackofficeDto } from './dto/update-pricing-backoffice.dto';
import type { TenantPlan } from '../../app/tenants/entities/tenant.entity';
import { t } from '../../../constant/messages';

function toResponse(p: PricingConfigEntity) {
  return {
    id: p.id,
    plan: p.plan,
    price: p.price,
    period_months: p.periodMonths,
    default_user_quota: p.defaultUserQuota,
    default_branch_quota: p.defaultBranchQuota,
    extra_user_price: p.extraUserPrice,
    extra_branch_price: p.extraBranchPrice,
    trial_days: p.trialDays,
    trial_max_transactions: p.trialMaxTransactions,
    is_active: p.isActive,
    is_landing: p.isLanding,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

@Injectable()
export class PricingBackofficeService {
  constructor(
    @InjectRepository(PricingConfigEntity)
    private readonly pricingRepository: Repository<PricingConfigEntity>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, keyword = '' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<PricingConfigEntity> = keyword
      ? ({
          plan: ILike(`%${keyword}%`),
        } as FindOptionsWhere<PricingConfigEntity>)
      : {};
    const [rows, total] = await this.pricingRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { price: 'ASC' },
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
    const row = await this.pricingRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException(t('pricing_not_found'));
    return toResponse(row);
  }

  async create(dto: CreatePricingBackofficeDto) {
    const existing = await this.pricingRepository.findOne({
      where: { plan: dto.plan as TenantPlan },
    });
    if (existing) {
      throw new ConflictException(
        `Plan "${dto.plan}" sudah ada, gunakan edit untuk mengubah harga`,
      );
    }
    const row = this.pricingRepository.create({
      plan: dto.plan as TenantPlan,
      price: dto.price,
      periodMonths: dto.period_months,
      defaultUserQuota: dto.default_user_quota,
      defaultBranchQuota: dto.default_branch_quota,
      extraUserPrice: dto.extra_user_price,
      extraBranchPrice: dto.extra_branch_price,
      trialDays: dto.trial_days,
      trialMaxTransactions: dto.trial_max_transactions,
      isActive: dto.is_active ?? true,
      isLanding: dto.is_landing ?? false,
    });
    await this.pricingRepository.save(row);
    return toResponse(row);
  }

  async update(id: string, dto: UpdatePricingBackofficeDto) {
    const row = await this.pricingRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException(t('pricing_not_found'));

    if (dto.plan != null && dto.plan !== row.plan) {
      const dup = await this.pricingRepository.findOne({
        where: { plan: dto.plan as TenantPlan },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException(
          t('pricing_plan_already_exists', { plan: dto.plan }),
        );
      }
      row.plan = dto.plan as TenantPlan;
    }
    if (dto.price != null) row.price = dto.price;
    if (dto.period_months != null) row.periodMonths = dto.period_months;
    if (dto.default_user_quota != null)
      row.defaultUserQuota = dto.default_user_quota;
    if (dto.default_branch_quota != null)
      row.defaultBranchQuota = dto.default_branch_quota;
    if (dto.extra_user_price != null) row.extraUserPrice = dto.extra_user_price;
    if (dto.extra_branch_price != null)
      row.extraBranchPrice = dto.extra_branch_price;
    if (dto.trial_days != null) row.trialDays = dto.trial_days;
    if (dto.trial_max_transactions != null)
      row.trialMaxTransactions = dto.trial_max_transactions;
    if (dto.is_active != null) row.isActive = dto.is_active;
    if (dto.is_landing != null) row.isLanding = dto.is_landing;

    await this.pricingRepository.save(row);
    return toResponse(row);
  }

  async remove(id: string) {
    const row = await this.pricingRepository.findOne({ where: { id } });
    if (!row) throw new NotFoundException(t('pricing_not_found'));
    await this.pricingRepository.remove(row);
    return { message: 'Pricing berhasil dihapus' };
  }
}
