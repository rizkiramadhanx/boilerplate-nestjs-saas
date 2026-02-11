import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { OutletEntity } from '../../outlets/entities/outlet.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  price: number;

  @Column({ type: 'text', nullable: true })
  picture: string;

  @Column({ nullable: true })
  hpp: number;

  @Column()
  stock: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => OutletEntity, (outlet) => outlet.products)
  @JoinColumn({ name: 'outlet_id' })
  outlet: OutletEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;
}
