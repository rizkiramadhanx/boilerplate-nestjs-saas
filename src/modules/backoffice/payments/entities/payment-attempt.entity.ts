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
import { SubscriptionAddonEntity } from '../../addons/entities/subscription-addon.entity';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type PaymentPurpose = 'subscription' | 'addon';

@Entity('payment_attempts')
export class PaymentAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => SubscriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @ManyToOne(() => SubscriptionAddonEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'addon_id' })
  addon?: SubscriptionAddonEntity | null;

  @Column({ name: 'addon_id', type: 'uuid', nullable: true })
  addonId?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'subscription' })
  purpose: PaymentPurpose;

  @Column({ name: 'order_id', length: 64, unique: true })
  orderId: string;

  @Column({ type: 'varchar', length: 32, default: 'pakasir' })
  provider: string;

  @Column({ name: 'project_slug', length: 64 })
  projectSlug: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ name: 'payment_url', type: 'text', nullable: true })
  paymentUrl?: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: PaymentStatus;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse?: Record<string, unknown>;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
