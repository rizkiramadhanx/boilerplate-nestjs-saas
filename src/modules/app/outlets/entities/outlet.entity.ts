import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoleEntity } from '../../roles/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { ProductEntity } from '../../products/entities/product.entity';

@Entity('outlets')
export class OutletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ nullable: true })
  address?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => RoleEntity, (role) => role.outlet)
  roles: RoleEntity[];

  @OneToMany(() => UserEntity, (user) => user.outlet)
  users: UserEntity[];

  @OneToMany(() => CategoryEntity, (category) => category.outlet)
  categories: CategoryEntity[];

  @OneToMany(() => ProductEntity, (product) => product.outlet)
  products: ProductEntity[];
}
