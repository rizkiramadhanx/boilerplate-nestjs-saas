import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { TenantCleanupService } from './tenant-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([TenantEntity])],
  providers: [TenantCleanupService],
})
export class TenantCleanupModule {}
