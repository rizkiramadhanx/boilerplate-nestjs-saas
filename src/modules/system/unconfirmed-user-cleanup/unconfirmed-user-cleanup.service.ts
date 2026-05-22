import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserEntity } from '../../app/users/entities/user.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';

@Injectable()
export class UnconfirmedUserCleanupService {
  private readonly logger = new Logger(UnconfirmedUserCleanupService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  // Jalan setiap hari jam 03:00 WIB
  @Cron('0 0 3 * * *', { timeZone: 'Asia/Jakarta' })
  async removeUnconfirmedUsers() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const candidates = await this.userRepository.find({
      where: {
        isConfirmed: false,
        createdAt: LessThan(cutoff),
      },
      select: ['id', 'tenantId'],
    });

    if (!candidates.length) return;

    const tenantIds = [
      ...new Set(candidates.map((u) => u.tenantId).filter(Boolean)),
    ] as string[];

    // Cek tenant yang semua usernya unconfirmed (satu-satunya user di tenant)
    const tenantsToDelete: string[] = [];
    for (const tenantId of tenantIds) {
      const totalInTenant = await this.userRepository.count({
        where: { tenantId },
      });
      const unconfirmedInTenant = candidates.filter(
        (u) => u.tenantId === tenantId,
      ).length;
      if (totalInTenant === unconfirmedInTenant) {
        tenantsToDelete.push(tenantId);
      }
    }

    const userIds = candidates.map((u) => u.id);
    await this.userRepository.delete(userIds);
    this.logger.log(
      `${userIds.length} user belum konfirmasi dihapus (dibuat sebelum ${cutoff.toISOString()})`,
    );

    for (const tenantId of tenantsToDelete) {
      await this.tenantRepository.delete({ id: tenantId });
      this.logger.warn(`Tenant ${tenantId} dihapus — tidak ada user aktif`);
    }
  }
}
