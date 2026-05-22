import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TenantEntity,
  TenantPlan,
} from '../../../app/tenants/entities/tenant.entity';
import { SubscriptionChangeLogEntity } from './subscription-change-log.entity';

export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'failed';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 16 })
  plan: TenantPlan;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ name: 'user_quota', type: 'int' })
  userQuota: number;

  @Column({ name: 'branch_quota', type: 'int' })
  branchQuota: number;

  @Column({ name: 'period_start', type: 'timestamptz', nullable: true })
  periodStart?: Date;

  @Column({ name: 'period_end', type: 'timestamptz', nullable: true })
  periodEnd?: Date;

  @Column({ name: 'is_trial', type: 'boolean', default: false })
  isTrial: boolean;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @OneToMany(() => SubscriptionChangeLogEntity, (log) => log.subscription)
  changeLogs: SubscriptionChangeLogEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
