import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from '../modules/app/users/entities/user.entity';
import { BranchEntity } from '../modules/app/branches/entities/branch.entity';
import { RoleEntity } from '../modules/app/roles/entities/role.entity';
import { AdminEntity } from '../modules/backoffice/admins/entities/admin.entity';
import { LogEntity } from '../modules/app/logs/entities/log.entity';
import { TenantEntity } from '../modules/app/tenants/entities/tenant.entity';
import { UserBranchEntity } from '../modules/app/users/entities/user-branch.entity';
import { SubscriptionEntity } from '../modules/backoffice/subscriptions/entities/subscription.entity';
import { SubscriptionChangeLogEntity } from '../modules/backoffice/subscriptions/entities/subscription-change-log.entity';
import { PricingConfigEntity } from '../modules/backoffice/pricing/entities/pricing-config.entity';
import { PaymentAttemptEntity } from '../modules/backoffice/payments/entities/payment-attempt.entity';
import { PaymentWebhookLogEntity } from '../modules/backoffice/payments/entities/payment-webhook-log.entity';
import { SubscriptionAddonEntity } from '../modules/backoffice/addons/entities/subscription-addon.entity';
import { TransactionEntity } from '../modules/app/transactions/entities/transaction.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'crudnest',
  entities: [
    // SaaS layer
    AdminEntity,
    TenantEntity,
    PricingConfigEntity,
    SubscriptionEntity,
    SubscriptionChangeLogEntity,
    PaymentAttemptEntity,
    PaymentWebhookLogEntity,
    SubscriptionAddonEntity,
    // Application layer
    UserEntity,
    BranchEntity,
    RoleEntity,
    UserBranchEntity,
    TransactionEntity,
    LogEntity,
  ],
  migrations: ['src/migration/*.ts'],
  synchronize: false,
  logging: true,
});
