import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { BranchEntity } from '../../branches/entities/branch.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TransactionType } from '../enums/transaction-type.enum';

export type TransactionStatus = 'pending' | 'completed' | 'voided' | 'failed';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => BranchEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: BranchEntity;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'shift_id', type: 'uuid', nullable: true })
  shiftId: string | null;

  @Column({
    name: 'transaction_type',
    type: 'varchar',
    length: 32,
  })
  transactionType: TransactionType;

  @Column({
    name: 'payment_source',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  paymentSource: string | null;

  @Column({
    name: 'customer_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  customerName: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  principal: string | null;

  @Column({
    name: 'customer_fee',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  customerFee: string | null;

  @Column({
    name: 'agent_fee',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  agentFee: string | null;

  @Column({
    name: 'destination_number',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  destinationNumber: string | null;

  @Column({
    name: 'destination_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  destinationName: string | null;

  @Column({
    name: 'destination_provider',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  destinationProvider: string | null;

  @Column({ type: 'varchar', length: 16, default: 'completed' })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'voided_at', type: 'timestamptz', nullable: true })
  voidedAt: Date | null;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
