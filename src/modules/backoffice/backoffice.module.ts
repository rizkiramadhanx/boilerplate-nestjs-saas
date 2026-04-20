import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../app/auth/auth.module';
import { UserEntity } from '../app/users/entities/user.entity';
import { OutletEntity } from '../app/outlets/entities/outlet.entity';
import { ProductEntity } from '../app/products/entities/product.entity';
import { CategoryEntity } from '../app/categories/entities/category.entity';
import { RoleEntity } from '../app/roles/entities/role.entity';
import { AdminEntity } from './admins/entities/admin.entity';
import { AdminJwtStrategy } from '../app/auth/strategies/admin-jwt.strategy';
import { UsersBackofficeController } from './users/users-backoffice.controller';
import { UsersBackofficeService } from './users/users-backoffice.service';
import { AdminsBackofficeController } from './admins/admins-backoffice.controller';
import { AdminsBackofficeService } from './admins/admins-backoffice.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([
      UserEntity,
      AdminEntity,
      OutletEntity,
      ProductEntity,
      CategoryEntity,
      RoleEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '3600s',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersBackofficeController, AdminsBackofficeController],
  providers: [
    AdminJwtStrategy,
    UsersBackofficeService,
    AdminsBackofficeService,
    {
      provide: 'ADMIN_REFRESH_TOKEN_SERVICE',
      useFactory: (configService: ConfigService) => {
        return new JwtService({
          secret: configService.get('JWT_SECRET_REFRESH'),
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN_REFRESH'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class BackofficeModule {}
