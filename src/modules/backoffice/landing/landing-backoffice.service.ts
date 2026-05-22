import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingConfigEntity } from '../pricing/entities/pricing-config.entity';

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
    is_landing: p.isLanding,
  };
}

@Injectable()
export class LandingBackofficeService {
  constructor(
    @InjectRepository(PricingConfigEntity)
    private readonly pricingRepository: Repository<PricingConfigEntity>,
  ) {}

  async getPackages() {
    const rows = await this.pricingRepository.find({
      where: { isActive: true, isLanding: true },
      order: { price: 'ASC' },
    });
    return rows.map(toResponse);
  }
}
