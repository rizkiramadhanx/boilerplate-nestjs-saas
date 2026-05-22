import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../../app/tenants/entities/tenant.entity';
import { SubscriptionEntity } from '../../subscriptions/entities/subscription.entity';

export type AddonType = 'add_user' | 'add_branch';
export type AddonStatus = 'pending' | 'active' | 'expired' | 'cancelled';

@Entity('subscription_addons')
export class SubscriptionAddonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string;

  @Column({ type: 'varchar', length: 32 })
  type: AddonType;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'int', default: 0 })
  unitPrice: number;

  @Column({ name: 'prorated_months', type: 'int', default: 1 })
  proratedMonths: number;

  @Column({ type: 'int', default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: AddonStatus;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
