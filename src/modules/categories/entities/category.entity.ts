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
import { ProductEntity } from '../../products/entities/product.entity';
import { Exclude, Expose, Transform } from 'class-transformer';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose({ name: 'id' })
  id: string;

  @Column({ length: 255 })
  @Expose({ name: 'name' })
  name: string;

  @ManyToOne(() => OutletEntity, (outlet) => outlet.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outlet_id' })
  @Exclude()
  outlet: OutletEntity;

  @Expose({ name: 'outlet_id' })
  @Transform(({ obj }) => obj.outlet?.id ?? obj.outletId)
  outletId?: string;

  @OneToMany(() => ProductEntity, (product) => product.category)
  @Exclude()
  products: ProductEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  @Expose({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
