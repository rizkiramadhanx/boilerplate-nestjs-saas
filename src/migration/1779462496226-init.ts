import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1779462496226 implements MigrationInterface {
  name = 'Init1779462496226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "owner_name" character varying(255) NOT NULL, "owner_email" character varying(255) NOT NULL, "owner_phone" character varying(32), "status" character varying(16) NOT NULL DEFAULT 'trial', "plan" character varying(16), "user_quota" integer NOT NULL DEFAULT '3', "branch_quota" integer NOT NULL DEFAULT '1', "trial_ends_at" TIMESTAMP WITH TIME ZONE, "current_period_start" TIMESTAMP WITH TIME ZONE, "current_period_end" TIMESTAMP WITH TIME ZONE, "onboarding_completed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_080a52475f7ac2a11f261851334" UNIQUE ("owner_email"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "address" character varying, "shift_mode" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "is_admin" boolean NOT NULL DEFAULT false, "modules" jsonb NOT NULL DEFAULT '[]', "tenant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "is_confirmed" boolean NOT NULL DEFAULT false, "is_owner" boolean NOT NULL DEFAULT false, "password" character varying, "picture" character varying, "phone" character varying, "tenant_id" uuid, "last_login" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "branch_id" uuid, "role_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_051db7d37d478a69a7432df1479" UNIQUE ("email"), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(255) NOT NULL, "status" character varying(20) NOT NULL, "status_code" integer NOT NULL, "user_id" uuid, "branch_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_user_branch_user_branch" UNIQUE ("user_id", "branch_id"), CONSTRAINT "PK_45063e37edfcad5acaa0158c53a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_change_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "subscription_id" uuid NOT NULL, "change_type" character varying(24) NOT NULL, "old_value" character varying(64), "new_value" character varying(64), "price_delta" numeric(18,2) NOT NULL DEFAULT '0', "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL, "performed_by_user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a94c757e21b6c6fee39e5142591" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "plan" character varying(16) NOT NULL, "status" character varying(16) NOT NULL DEFAULT 'pending', "amount" numeric(18,2) NOT NULL, "user_quota" integer NOT NULL, "branch_quota" integer NOT NULL, "period_start" TIMESTAMP WITH TIME ZONE, "period_end" TIMESTAMP WITH TIME ZONE, "is_trial" boolean NOT NULL DEFAULT false, "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pricing_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan" character varying(16) NOT NULL, "price" numeric(18,2) NOT NULL, "period_months" integer NOT NULL, "default_user_quota" integer NOT NULL DEFAULT '3', "default_branch_quota" integer NOT NULL DEFAULT '1', "extra_user_price" numeric(18,2) NOT NULL DEFAULT '5000', "extra_branch_price" numeric(18,2) NOT NULL DEFAULT '10000', "trial_days" integer NOT NULL DEFAULT '14', "trial_max_transactions" integer NOT NULL DEFAULT '100', "is_active" boolean NOT NULL DEFAULT true, "is_landing" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_21b6fe44b526f1c4ff71a307386" UNIQUE ("plan"), CONSTRAINT "PK_68f45b3c5c0404cfa95eada68f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_addons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "subscription_id" uuid, "type" character varying(32) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" integer NOT NULL DEFAULT '0', "prorated_months" integer NOT NULL DEFAULT '1', "amount" integer NOT NULL DEFAULT '0', "status" character varying(16) NOT NULL DEFAULT 'pending', "activated_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2648ce4c6031da6cfb93f33665e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "subscription_id" uuid NOT NULL, "addon_id" uuid, "purpose" character varying(16) NOT NULL DEFAULT 'subscription', "order_id" character varying(64) NOT NULL, "provider" character varying(32) NOT NULL DEFAULT 'pakasir', "project_slug" character varying(64) NOT NULL, "amount" numeric(18,2) NOT NULL, "payment_url" text, "status" character varying(16) NOT NULL DEFAULT 'pending', "raw_response" jsonb, "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2a0b71e31054506a4b8d72a446e" UNIQUE ("order_id"), CONSTRAINT "PK_a0d8a67c07a0fef98dfd20214e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_webhook_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" character varying(64) NOT NULL, "payment_attempt_id" uuid, "raw_body" jsonb NOT NULL, "headers" jsonb, "status" character varying(16) NOT NULL DEFAULT 'received', "notes" text, "processed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b08bdb3156baf74902b89dfb161" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "branch_id" uuid NOT NULL, "user_id" uuid, "shift_id" uuid, "transaction_type" character varying(32) NOT NULL, "payment_source" character varying(64), "customer_name" character varying(255), "principal" numeric(18,2), "customer_fee" numeric(18,2), "agent_fee" numeric(18,2), "destination_number" character varying(64), "destination_name" character varying(255), "destination_provider" character varying(64), "status" character varying(16) NOT NULL DEFAULT 'completed', "notes" text, "voided_at" TIMESTAMP WITH TIME ZONE, "void_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" ADD CONSTRAINT "FK_fda619979f40a6a44fc9baf02c3" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_e59a01f4fe46ebbece575d9a0fc" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_70c2c3d40d9f661ac502de51349" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" ADD CONSTRAINT "FK_8d58b5b108f1f70f7f57ed8e410" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" ADD CONSTRAINT "FK_ec7bc82a21260e0887950252192" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" ADD CONSTRAINT "FK_a93a8dec13e6204974dd67386ed" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" ADD CONSTRAINT "FK_7252d91dd610730c97d6b58ae79" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_change_logs" ADD CONSTRAINT "FK_9fa90473fb1975d798c2f5380db" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_change_logs" ADD CONSTRAINT "FK_73aefb9a44c47f85eace5e27c97" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_change_logs" ADD CONSTRAINT "FK_c9d04ba9d77f4de78a55aa2c907" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD CONSTRAINT "FK_e7eabc23d5a9572769461e4f06e" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD CONSTRAINT "FK_a6967de14fe6bf60070019bea34" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" ADD CONSTRAINT "FK_9d6b1f231284bfdc89fbf20e651" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" ADD CONSTRAINT "FK_04c691963316eacf2893eb04909" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" ADD CONSTRAINT "FK_35d884d56f89de7c2fd1b6c0227" FOREIGN KEY ("addon_id") REFERENCES "subscription_addons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_webhook_logs" ADD CONSTRAINT "FK_d34046f60f8488b4d22b69aa072" FOREIGN KEY ("payment_attempt_id") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_f9d1859399e7f8dd36e4e10bd22" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_f9d1859399e7f8dd36e4e10bd22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_4f27188c6c1d993bc76aeddcded"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_webhook_logs" DROP CONSTRAINT "FK_d34046f60f8488b4d22b69aa072"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" DROP CONSTRAINT "FK_35d884d56f89de7c2fd1b6c0227"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" DROP CONSTRAINT "FK_04c691963316eacf2893eb04909"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" DROP CONSTRAINT "FK_9d6b1f231284bfdc89fbf20e651"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP CONSTRAINT "FK_a6967de14fe6bf60070019bea34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP CONSTRAINT "FK_e7eabc23d5a9572769461e4f06e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_change_logs" DROP CONSTRAINT "FK_c9d04ba9d77f4de78a55aa2c907"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_change_logs" DROP CONSTRAINT "FK_73aefb9a44c47f85eace5e27c97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_change_logs" DROP CONSTRAINT "FK_9fa90473fb1975d798c2f5380db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" DROP CONSTRAINT "FK_7252d91dd610730c97d6b58ae79"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" DROP CONSTRAINT "FK_a93a8dec13e6204974dd67386ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_branches" DROP CONSTRAINT "FK_ec7bc82a21260e0887950252192"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" DROP CONSTRAINT "FK_8d58b5b108f1f70f7f57ed8e410"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logs" DROP CONSTRAINT "FK_70c2c3d40d9f661ac502de51349"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_e59a01f4fe46ebbece575d9a0fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "branches" DROP CONSTRAINT "FK_fda619979f40a6a44fc9baf02c3"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "payment_webhook_logs"`);
    await queryRunner.query(`DROP TABLE "payment_attempts"`);
    await queryRunner.query(`DROP TABLE "subscription_addons"`);
    await queryRunner.query(`DROP TABLE "pricing_configs"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "subscription_change_logs"`);
    await queryRunner.query(`DROP TABLE "user_branches"`);
    await queryRunner.query(`DROP TABLE "logs"`);
    await queryRunner.query(`DROP TABLE "admins"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "branches"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
