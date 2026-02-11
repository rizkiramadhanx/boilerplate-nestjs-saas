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

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'boolean', default: false, name: 'is_admin' })
  isAdmin: boolean;

  @Column({ type: 'jsonb', nullable: false, default: () => "'[]'" })
  modules: string[];

  @ManyToOne(() => OutletEntity, (outlet) => outlet.roles, { eager: false })
  @JoinColumn({ name: 'outlet_id' })
  outlet: OutletEntity;

  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
