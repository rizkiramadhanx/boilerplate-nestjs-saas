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
import { Exclude, Expose, Transform } from 'class-transformer';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ name: 'id' })
  id: string;

  @Column({ length: 500 })
  @Expose({ name: 'name' })
  name: string;

  @Column('text')
  @Expose({ name: 'description' })
  description: string;

  @Column()
  @Expose({ name: 'price' })
  price: number;

  @Column({ type: 'text', nullable: true })
  @Expose({ name: 'picture' })
  picture: string;

  @Column({ nullable: true })
  @Expose({ name: 'hpp' })
  hpp: number;

  @Column()
  @Expose({ name: 'stock' })
  stock: number;

  @Column({ nullable: true })
  @Expose({ name: 'sku' })
  sku: string;

  @Column({ name: 'is_active', default: true })
  @Expose({ name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OutletEntity, (outlet) => outlet.products)
  @JoinColumn({ name: 'outlet_id' })
  @Exclude()
  outlet: OutletEntity;

  @Expose({ name: 'outlet_id' })
  @Transform(({ obj }) => obj.outlet?.id ?? obj.outletId)
  outletId?: string;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  @Exclude()
  category: CategoryEntity;

  @Expose({ name: 'category_id' })
  @Transform(({ obj }) => obj.category?.id ?? obj.categoryId ?? null)
  categoryId?: string;
}
