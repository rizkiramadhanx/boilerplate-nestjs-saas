import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { UserEntity } from '../../app/users/entities/user.entity';
import { LogEntity } from '../../app/logs/entities/log.entity';

@Injectable()
export class TenantCleanupService {
  private readonly logger = new Logger(TenantCleanupService.name);
  private readonly inactivityMonths = 6;

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  // Dinonaktifkan sementara
  // @Cron('0 30 2 * * *', { timeZone: 'Asia/Jakarta' })
  async removeInactiveTenants() {
    const cutoff = this.getCutoffDate();

    const rows = await this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoin(UserEntity, 'user', 'user.tenantId = tenant.id')
      .leftJoin(
        LogEntity,
        'log',
        "log.userId = user.id AND log.action = 'auth:login' AND log.status = 'SUCCESS'",
      )
      .select('tenant.id', 'id')
      .addSelect(
        'COALESCE(MAX(log.createdAt), MAX(user.updatedAt), tenant.updatedAt, tenant.createdAt)',
        'lastActivityAt',
      )
      .groupBy('tenant.id')
      .having(
        'COALESCE(MAX(log.createdAt), MAX(user.updatedAt), tenant.updatedAt, tenant.createdAt) < :cutoff',
        { cutoff: cutoff.toISOString() },
      )
      .getRawMany<{ id: string; lastActivityAt: string }>();

    if (!rows.length) {
      return;
    }

    for (const row of rows) {
      await this.tenantRepository.delete({ id: row.id });
      this.logger.warn(
        `Tenant ${row.id} dihapus otomatis (inactive sejak ${row.lastActivityAt})`,
      );
    }
  }

  private getCutoffDate() {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - this.inactivityMonths);
    return cutoff;
  }
}
