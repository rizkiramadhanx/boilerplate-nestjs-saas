import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from '../modules/users/entities/user.entity';
import { ProductEntity } from '../modules/products/entities/product.entity';
import { RefreshTokenEntity } from '../modules/auth/entities/refresh-token.entity';
import { OutletEntity } from '../modules/outlets/entities/outlet.entity';
import { RoleEntity } from '../modules/roles/entities/role.entity';
import { CategoryEntity } from '../modules/categories/entities/category.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'crudnest',
  entities: [
    UserEntity,
    ProductEntity,
    RefreshTokenEntity,
    OutletEntity,
    RoleEntity,
    CategoryEntity,
  ],
  migrations: ['src/migration/*.ts'],
  synchronize: false,
  logging: true,
});
