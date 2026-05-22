import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PaymentAttemptEntity } from './payment-attempt.entity';

export type WebhookStatus = 'received' | 'processed' | 'failed' | 'duplicate';

@Entity('payment_webhook_logs')
export class PaymentWebhookLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', length: 64 })
  orderId: string;

  @ManyToOne(() => PaymentAttemptEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'payment_attempt_id' })
  paymentAttempt?: PaymentAttemptEntity;

  @Column({ name: 'payment_attempt_id', type: 'uuid', nullable: true })
  paymentAttemptId?: string;

  @Column({ name: 'raw_body', type: 'jsonb' })
  rawBody: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  headers?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 16, default: 'received' })
  status: WebhookStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
