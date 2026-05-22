import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantPlan } from '../../../app/tenants/entities/tenant.entity';

@Entity('pricing_configs')
export class PricingConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 16, unique: true })
  plan: TenantPlan;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  price: string;

  @Column({ name: 'period_months', type: 'int' })
  periodMonths: number;

  @Column({ name: 'default_user_quota', type: 'int', default: 3 })
  defaultUserQuota: number;

  @Column({ name: 'default_branch_quota', type: 'int', default: 1 })
  defaultBranchQuota: number;

  @Column({
    name: 'extra_user_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 5000,
  })
  extraUserPrice: string;

  @Column({
    name: 'extra_branch_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 10000,
  })
  extraBranchPrice: string;

  @Column({ name: 'trial_days', type: 'int', default: 14 })
  trialDays: number;

  @Column({ name: 'trial_max_transactions', type: 'int', default: 100 })
  trialMaxTransactions: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_landing', type: 'boolean', default: false })
  isLanding: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
