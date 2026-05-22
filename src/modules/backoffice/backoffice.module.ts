import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../app/auth/auth.module';
import { UserEntity } from '../app/users/entities/user.entity';
import { BranchEntity } from '../app/branches/entities/branch.entity';
import { RoleEntity } from '../app/roles/entities/role.entity';
import { TenantEntity } from '../app/tenants/entities/tenant.entity';
import { AdminEntity } from './admins/entities/admin.entity';
import { AdminJwtStrategy } from '../app/auth/strategies/admin-jwt.strategy';
import { UsersBackofficeController } from './users/users-backoffice.controller';
import { UsersBackofficeService } from './users/users-backoffice.service';
import { AdminsBackofficeController } from './admins/admins-backoffice.controller';
import { AdminsBackofficeService } from './admins/admins-backoffice.service';
import { TenantsBackofficeController } from './tenants/tenants-backoffice.controller';
import { TenantsBackofficeService } from './tenants/tenants-backoffice.service';
import { DashboardBackofficeController } from './dashboard/dashboard-backoffice.controller';
import { DashboardBackofficeService } from './dashboard/dashboard-backoffice.service';
import { PricingBackofficeController } from './pricing/pricing-backoffice.controller';
import { PricingBackofficeService } from './pricing/pricing-backoffice.service';
import { PricingConfigEntity } from './pricing/entities/pricing-config.entity';
import { PaymentsBackofficeController } from './payments/payments-backoffice.controller';
import { PaymentsBackofficeService } from './payments/payments-backoffice.service';
import { PaymentAttemptEntity } from './payments/entities/payment-attempt.entity';
import { PaymentWebhookLogEntity } from './payments/entities/payment-webhook-log.entity';
import { SubscriptionsBackofficeController } from './subscriptions/subscriptions-backoffice.controller';
import { SubscriptionsBackofficeService } from './subscriptions/subscriptions-backoffice.service';
import { SubscriptionEntity } from './subscriptions/entities/subscription.entity';
import { AddonsBackofficeController } from './addons/addons-backoffice.controller';
import { AddonsBackofficeService } from './addons/addons-backoffice.service';
import { SubscriptionAddonEntity } from './addons/entities/subscription-addon.entity';
import { LandingBackofficeController } from './landing/landing-backoffice.controller';
import { LandingBackofficeService } from './landing/landing-backoffice.service';
import { TransactionsBackofficeController } from './transactions/transactions-backoffice.controller';
import { TransactionsBackofficeService } from './transactions/transactions-backoffice.service';
import { TransactionEntity } from '../app/transactions/entities/transaction.entity';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([
      UserEntity,
      AdminEntity,
      BranchEntity,
      RoleEntity,
      TenantEntity,
      PricingConfigEntity,
      PaymentAttemptEntity,
      PaymentWebhookLogEntity,
      SubscriptionEntity,
      SubscriptionAddonEntity,
      TransactionEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ADMIN_EXPIRES_IN') || '30d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    UsersBackofficeController,
    AdminsBackofficeController,
    TenantsBackofficeController,
    DashboardBackofficeController,
    PricingBackofficeController,
    PaymentsBackofficeController,
    SubscriptionsBackofficeController,
    AddonsBackofficeController,
    LandingBackofficeController,
    TransactionsBackofficeController,
  ],
  providers: [
    AdminJwtStrategy,
    UsersBackofficeService,
    AdminsBackofficeService,
    TenantsBackofficeService,
    DashboardBackofficeService,
    PricingBackofficeService,
    PaymentsBackofficeService,
    SubscriptionsBackofficeService,
    AddonsBackofficeService,
    LandingBackofficeService,
    TransactionsBackofficeService,
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
