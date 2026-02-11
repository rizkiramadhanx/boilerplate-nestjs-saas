import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';
import { OutletEntity } from '../../outlets/entities/outlet.entity';
import { RoleEntity } from '../../roles/entities/role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false, name: 'is_confirmed' })
  isConfirmed: boolean;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  // Optional additional profile fields
  @Column({ nullable: true })
  picture: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // New relations for multi-outlet RBAC
  @ManyToOne(() => OutletEntity, (outlet) => outlet.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outlet_id' })
  outlet: OutletEntity;

  @ManyToOne(() => RoleEntity, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role?: RoleEntity;
}
