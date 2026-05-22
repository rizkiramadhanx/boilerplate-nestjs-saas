import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../app/users/entities/user.entity';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { UnconfirmedUserCleanupService } from './unconfirmed-user-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TenantEntity])],
  providers: [UnconfirmedUserCleanupService],
})
export class UnconfirmedUserCleanupModule {}
