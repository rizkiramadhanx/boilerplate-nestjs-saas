import { EntityManager } from 'typeorm';
import { PricingConfigEntity } from '../modules/backoffice/pricing/entities/pricing-config.entity';
import type { TenantPlan } from '../modules/app/tenants/entities/tenant.entity';

type PricingPackage = {
  plan: TenantPlan;
  price: string;
  periodMonths: number;
  defaultUserQuota: number;
  defaultBranchQuota: number;
  extraUserPrice: string;
  extraBranchPrice: string;
  trialDays: number;
  trialMaxTransactions: number;
  isActive: boolean;
};

const MONTHLY_PACKAGE: PricingPackage = {
  plan: 'monthly',
  price: '49000.00',
  periodMonths: 1,
  defaultUserQuota: 3,
  defaultBranchQuota: 1,
  extraUserPrice: '5000.00',
  extraBranchPrice: '10000.00',
  trialDays: 14,
  trialMaxTransactions: 100,
  isActive: true,
};

const BIANNUAL_PACKAGE: PricingPackage = {
  plan: 'biannual',
  price: '264000.00',
  periodMonths: 6,
  defaultUserQuota: 3,
  defaultBranchQuota: 1,
  extraUserPrice: '5000.00',
  extraBranchPrice: '10000.00',
  trialDays: 14,
  trialMaxTransactions: 100,
  isActive: true,
};

const ANNUAL_PACKAGE: PricingPackage = {
  plan: 'annual',
  price: '499000.00',
  periodMonths: 12,
  defaultUserQuota: 3,
  defaultBranchQuota: 1,
  extraUserPrice: '5000.00',
  extraBranchPrice: '10000.00',
  trialDays: 14,
  trialMaxTransactions: 100,
  isActive: true,
};

async function upsertPackage(
  manager: EntityManager,
  pkg: PricingPackage,
): Promise<{ id: string; created: boolean }> {
  const repo = manager.getRepository(PricingConfigEntity);
  const existing = await repo.findOne({ where: { plan: pkg.plan } });
  if (existing) {
    Object.assign(existing, pkg);
    await repo.save(existing);
    return { id: existing.id, created: false };
  }
  const row = repo.create(pkg);
  await repo.save(row);
  return { id: row.id, created: true };
}

export async function seedMonthlyPricingPackage(manager: EntityManager) {
  return upsertPackage(manager, MONTHLY_PACKAGE);
}

export async function seedBiannualPricingPackage(manager: EntityManager) {
  return upsertPackage(manager, BIANNUAL_PACKAGE);
}

export async function seedAnnualPricingPackage(manager: EntityManager) {
  return upsertPackage(manager, ANNUAL_PACKAGE);
}

export async function seedAllPricingPackages(manager: EntityManager) {
  const monthly = await seedMonthlyPricingPackage(manager);
  const biannual = await seedBiannualPricingPackage(manager);
  const annual = await seedAnnualPricingPackage(manager);
  return { monthly, biannual, annual };
}
