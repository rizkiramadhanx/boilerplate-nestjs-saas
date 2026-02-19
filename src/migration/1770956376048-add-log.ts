import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLog1770956376048 implements MigrationInterface {
    name = 'AddLog1770956376048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "outlet_id" uuid NOT NULL, "action" character varying(255) NOT NULL, "user_id" uuid, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "status" character varying(50) NOT NULL, "status_code" character varying(50), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "logs" ADD CONSTRAINT "FK_718e2c8676a28ac2c3ed8667ee4" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "logs" ADD CONSTRAINT "FK_70c2c3d40d9f661ac502de51349" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_70c2c3d40d9f661ac502de51349"`);
        await queryRunner.query(`ALTER TABLE "logs" DROP CONSTRAINT "FK_718e2c8676a28ac2c3ed8667ee4"`);
        await queryRunner.query(`DROP TABLE "logs"`);
    }

}
