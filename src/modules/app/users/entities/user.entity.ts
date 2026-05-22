import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { BranchEntity } from '../../branches/entities/branch.entity';
import { RoleEntity } from '../../roles/entities/role.entity';
import { TenantEntity } from '../../tenants/entities/tenant.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ name: 'id' })
  id: string;

  @Column()
  @Expose({ name: 'name' })
  name: string;

  @Column({ unique: true })
  @Expose({ name: 'email' })
  email: string;

  @Column({ default: false, name: 'is_confirmed' })
  @Expose({ name: 'is_confirmed' })
  isConfirmed: boolean;

  @Column({ default: false, name: 'is_owner' })
  @Expose({ name: 'is_owner' })
  isOwner: boolean;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  @Expose({ name: 'picture' })
  picture: string;

  @Column({ nullable: true, unique: true })
  @Expose({ name: 'phone' })
  phone?: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  @Exclude()
  tenant?: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Expose({ name: 'tenant_id' })
  tenantId?: string;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  @Expose({ name: 'last_login' })
  lastLogin?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BranchEntity, (branch) => branch.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  @Exclude()
  branch: BranchEntity;

  @Expose({ name: 'branch_id' })
  @Transform(({ obj }) => obj.branch?.id ?? obj.branchId)
  branchId?: string;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  @Expose({ name: 'role' })
  @Type(() => RoleEntity)
  role?: RoleEntity;

  @Expose({ name: 'role_id' })
  @Transform(({ obj }) => obj.role?.id ?? obj.roleId ?? null)
  roleId?: string;
}
