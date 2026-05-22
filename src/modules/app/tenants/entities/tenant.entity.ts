import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TenantPlan = string;
export type TenantStatus = 'trial' | 'active' | 'expired' | 'suspended';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'owner_name', length: 255 })
  ownerName: string;

  @Column({ name: 'owner_email', length: 255, unique: true })
  ownerEmail: string;

  @Column({ name: 'owner_phone', length: 32, nullable: true })
  ownerPhone?: string;

  @Column({ type: 'varchar', length: 16, default: 'trial' })
  status: TenantStatus;

  @Column({ type: 'varchar', length: 16, nullable: true })
  plan?: TenantPlan;

  @Column({ name: 'user_quota', type: 'int', default: 3 })
  userQuota: number;

  @Column({ name: 'branch_quota', type: 'int', default: 1 })
  branchQuota: number;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt?: Date;

  @Column({
    name: 'current_period_start',
    type: 'timestamptz',
    nullable: true,
  })
  currentPeriodStart?: Date;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
