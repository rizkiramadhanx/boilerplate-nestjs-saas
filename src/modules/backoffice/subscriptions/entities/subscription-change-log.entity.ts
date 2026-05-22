import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../../app/tenants/entities/tenant.entity';
import { UserEntity } from '../../../app/users/entities/user.entity';
import { SubscriptionEntity } from './subscription.entity';

export type SubscriptionChangeType =
  | 'add_user'
  | 'remove_user'
  | 'add_branch'
  | 'remove_branch'
  | 'upgrade_plan'
  | 'downgrade_plan';

@Entity('subscription_change_logs')
export class SubscriptionChangeLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => SubscriptionEntity, (sub) => sub.changeLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'change_type', type: 'varchar', length: 24 })
  changeType: SubscriptionChangeType;

  @Column({ name: 'old_value', type: 'varchar', length: 64, nullable: true })
  oldValue?: string;

  @Column({ name: 'new_value', type: 'varchar', length: 64, nullable: true })
  newValue?: string;

  @Column({
    name: 'price_delta',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  priceDelta: string;

  @Column({ name: 'effective_from', type: 'timestamptz' })
  effectiveFrom: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'performed_by_user_id' })
  performedBy?: UserEntity;

  @Column({ name: 'performed_by_user_id', type: 'uuid', nullable: true })
  performedByUserId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
