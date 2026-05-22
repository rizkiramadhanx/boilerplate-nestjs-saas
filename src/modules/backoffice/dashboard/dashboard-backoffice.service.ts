import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { UserEntity } from '../../app/users/entities/user.entity';
import { PaymentAttemptEntity } from '../payments/entities/payment-attempt.entity';

type DashboardSummary = {
  tenants: {
    total: number;
    by_status: Record<string, number>;
  };
  users: {
    total: number;
  };
  profit: {
    total: string;
  };
  acquisition: {
    today: { tenants: number; users: number };
    last_7_days: { tenants: number; users: number };
    last_30_days: { tenants: number; users: number };
  };
  monthly_acquisition: Array<{
    month: number;
    trial: number;
    subscribe: number;
  }>;
  cumulative_users: Array<{
    month: number;
    semua: number;
    subscribe: number;
    trial: number;
  }>;
  year: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

@Injectable()
export class DashboardBackofficeService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PaymentAttemptEntity)
    private readonly paymentRepository: Repository<PaymentAttemptEntity>,
  ) {}

  async getSummary(year?: number): Promise<DashboardSummary> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const sevenAgo = addDays(todayStart, -6);
    const thirtyAgo = addDays(todayStart, -29);
    const tomorrowStart = addDays(todayStart, 1);

    const targetYear = year ?? now.getFullYear();
    const yearStart = new Date(targetYear, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(targetYear + 1, 0, 1, 0, 0, 0, 0);

    const [
      totalTenants,
      totalUsers,
      trialCount,
      activeCount,
      expiredCount,
      suspendedCount,
      tenantsToday,
      usersToday,
      tenants7,
      users7,
      tenants30,
      users30,
      tenantsInYear,
      usersInYear,
      allTenants,
      profitSumRaw,
    ] = await Promise.all([
      this.tenantRepository.count(),
      this.userRepository.count(),
      this.tenantRepository.count({ where: { status: 'trial' } }),
      this.tenantRepository.count({ where: { status: 'active' } }),
      this.tenantRepository.count({ where: { status: 'expired' } }),
      this.tenantRepository.count({ where: { status: 'suspended' } }),
      this.tenantRepository.count({
        where: { createdAt: Between(todayStart, tomorrowStart) },
      }),
      this.userRepository.count({
        where: { createdAt: Between(todayStart, tomorrowStart) },
      }),
      this.tenantRepository.count({
        where: { createdAt: MoreThanOrEqual(sevenAgo) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(sevenAgo) },
      }),
      this.tenantRepository.count({
        where: { createdAt: MoreThanOrEqual(thirtyAgo) },
      }),
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(thirtyAgo) },
      }),
      this.tenantRepository.find({
        where: { createdAt: Between(yearStart, yearEnd) },
        select: ['id', 'createdAt', 'status'],
      }),
      this.userRepository.find({
        where: { createdAt: Between(yearStart, yearEnd) },
        select: ['id', 'createdAt', 'tenantId'],
      }),
      this.tenantRepository.find({
        select: ['id', 'status'],
      }),
      this.paymentRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: 'paid' })
        .getRawOne<{ total: string }>(),
    ]);

    const profitTotal = profitSumRaw?.total ? String(profitSumRaw.total) : '0';

    const monthly: Array<{
      month: number;
      trial: number;
      subscribe: number;
    }> = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      trial: 0,
      subscribe: 0,
    }));

    for (const t of tenantsInYear) {
      const monthIdx = t.createdAt.getMonth();
      const slot = monthly[monthIdx];
      if (!slot) continue;
      if (t.status === 'trial') {
        slot.trial++;
      } else if (t.status === 'active') {
        slot.subscribe++;
      }
    }

    const tenantStatusMap = new Map<string, string>();
    for (const t of allTenants) {
      tenantStatusMap.set(t.id, t.status);
    }

    const perMonthUsers: Array<{
      semua: number;
      subscribe: number;
      trial: number;
    }> = Array.from({ length: 12 }, () => ({
      semua: 0,
      subscribe: 0,
      trial: 0,
    }));

    for (const u of usersInYear) {
      const monthIdx = u.createdAt.getMonth();
      const slot = perMonthUsers[monthIdx];
      if (!slot) continue;
      slot.semua++;
      const status = u.tenantId ? tenantStatusMap.get(u.tenantId) : undefined;
      if (status === 'active') slot.subscribe++;
      else if (status === 'trial') slot.trial++;
    }

    const cumulative_users: Array<{
      month: number;
      semua: number;
      subscribe: number;
      trial: number;
    }> = [];
    let runSemua = 0;
    let runSubscribe = 0;
    let runTrial = 0;
    const maxMonth = targetYear === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let i = 0; i < maxMonth; i++) {
      const m = perMonthUsers[i]!;
      runSemua += m.semua;
      runSubscribe += m.subscribe;
      runTrial += m.trial;
      cumulative_users.push({
        month: i + 1,
        semua: runSemua,
        subscribe: runSubscribe,
        trial: runTrial,
      });
    }

    return {
      tenants: {
        total: totalTenants,
        by_status: {
          trial: trialCount,
          active: activeCount,
          expired: expiredCount,
          suspended: suspendedCount,
        },
      },
      users: { total: totalUsers },
      profit: { total: profitTotal },
      acquisition: {
        today: { tenants: tenantsToday, users: usersToday },
        last_7_days: { tenants: tenants7, users: users7 },
        last_30_days: { tenants: tenants30, users: users30 },
      },
      monthly_acquisition: monthly.slice(0, maxMonth),
      cumulative_users,
      year: targetYear,
    };
  }
}
