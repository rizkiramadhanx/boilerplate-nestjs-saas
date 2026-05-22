import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { BranchEntity } from '../branches/entities/branch.entity';
import { RoleEntity } from '../roles/entities/role.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { UserBranchEntity } from '../users/entities/user-branch.entity';
import { PricingConfigEntity } from '../../backoffice/pricing/entities/pricing-config.entity';
import { SubscriptionEntity } from '../../backoffice/subscriptions/entities/subscription.entity';
import { PaymentAttemptEntity } from '../../backoffice/payments/entities/payment-attempt.entity';
import { PaymentWebhookLogEntity } from '../../backoffice/payments/entities/payment-webhook-log.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './../../../config/jwt.config';
import { DatabaseModule } from './../../../database/database.module';
import databaseConfig from './../../../config/database.config';
import { MailService } from '../mailer/mailer.service';
import { MailModule } from '../mailer/mailer.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    DatabaseModule,
    LogsModule,
    PassportModule,
    MailModule,
    TypeOrmModule.forFeature([
      UserEntity,
      BranchEntity,
      RoleEntity,
      TenantEntity,
      UserBranchEntity,
      PricingConfigEntity,
      SubscriptionEntity,
      PaymentAttemptEntity,
      PaymentWebhookLogEntity,
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ConfigModule.forFeature(config),
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET_REFRESH'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN_REFRESH'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    // moved security guards here
    MailService,
    {
      provide: 'ACCESS_TOKEN_SERVICE',
      useExisting: JwtService,
    },
    {
      provide: 'REFRESH_TOKEN_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const jwtService = new JwtService({
          secret: configService.get('JWT_SECRET_REFRESH'),
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN_REFRESH'),
          },
        });
        return jwtService;
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, DatabaseModule], // Export AuthService jika diperlukan di modul lain
})
export class AuthModule {}
