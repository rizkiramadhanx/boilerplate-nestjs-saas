import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { Exclude, Expose, Transform } from 'class-transformer';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ name: 'id' })
  id: string;

  @Column({ length: 100 })
  @Expose({ name: 'name' })
  name: string;

  @Column({ type: 'boolean', default: false, name: 'is_admin' })
  @Expose({ name: 'is_admin' })
  isAdmin: boolean;

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'" })
  @Expose({ name: 'modules' })
  modules: string[];

  @ManyToOne(() => TenantEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  @Exclude()
  tenant: TenantEntity;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Expose({ name: 'tenant_id' })
  @Transform(({ obj }) => obj.tenant?.id ?? obj.tenantId)
  tenantId: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  @Exclude()
  users: UserEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
