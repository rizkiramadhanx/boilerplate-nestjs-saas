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
import { OutletEntity } from '../../outlets/entities/outlet.entity';
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

  @ManyToOne(() => OutletEntity, (outlet) => outlet.roles, { eager: false })
  @JoinColumn({ name: 'outlet_id' })
  @Exclude()
  outlet: OutletEntity;

  @Expose({ name: 'outlet_id' })
  @Transform(({ obj }) => obj.outlet?.id ?? obj.outletId)
  outletId?: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  @Exclude()
  users: UserEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
