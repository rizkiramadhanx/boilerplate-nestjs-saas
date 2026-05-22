import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1779459553149 implements MigrationInterface {
  name = 'Init1779459553149';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP CONSTRAINT "FK_a6967de14fe6bf60070019bea34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_a8d3ae44663921129bda4dcf6df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "voided_by"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "is_debt"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "debt_customer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ALTER COLUMN "subscription_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD "type" character varying(32) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ALTER COLUMN "quantity" SET DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP COLUMN "unit_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD "unit_price" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ALTER COLUMN "prorated_months" SET DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD "amount" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payment_source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "payment_source" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "customer_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "customer_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "principal" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "customer_fee" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "customer_fee" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "agent_fee" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "agent_fee" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "destination_provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "destination_provider" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'completed'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD CONSTRAINT "FK_a6967de14fe6bf60070019bea34" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP CONSTRAINT "FK_a6967de14fe6bf60070019bea34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'success'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "destination_provider"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "destination_provider" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "agent_fee" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "agent_fee" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "customer_fee" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "customer_fee" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "principal" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "customer_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "customer_name" character varying(100) NOT NULL DEFAULT 'Customer'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payment_source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "payment_source" character varying(32) NOT NULL DEFAULT 'agent_balance'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD "amount" numeric(18,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ALTER COLUMN "prorated_months" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP COLUMN "unit_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD "unit_price" numeric(18,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ALTER COLUMN "quantity" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" DROP COLUMN "type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD "type" character varying(16) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ALTER COLUMN "subscription_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "debt_customer_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "is_debt" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "voided_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_a8d3ae44663921129bda4dcf6df" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_addons" ADD CONSTRAINT "FK_a6967de14fe6bf60070019bea34" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
