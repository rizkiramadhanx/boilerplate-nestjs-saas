import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Exclude, Expose, Transform } from 'class-transformer';
import { OutletEntity } from '../../outlets/entities/outlet.entity';
import { RoleEntity } from '../../roles/entities/role.entity';

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

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  @Expose({ name: 'picture' })
  picture: string;

  @CreateDateColumn({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OutletEntity, (outlet) => outlet.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outlet_id' })
  @Exclude()
  outlet: OutletEntity;

  @Expose({ name: 'outlet_id' })
  @Transform(({ obj }) => obj.outlet?.id ?? obj.outletId)
  outletId?: string;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  @Exclude()
  role?: RoleEntity;

  @Expose({ name: 'role_id' })
  @Transform(({ obj }) => obj.role?.id ?? obj.roleId ?? null)
  roleId?: string;
}
