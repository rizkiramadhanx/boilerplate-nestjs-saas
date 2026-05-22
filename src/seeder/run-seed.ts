import * as bcrypt from 'bcrypt';
import dataSource from '../config/typeorm.config';
import { TenantEntity } from '../modules/app/tenants/entities/tenant.entity';
import { BranchEntity } from '../modules/app/branches/entities/branch.entity';
import { RoleEntity } from '../modules/app/roles/entities/role.entity';
import { UserEntity } from '../modules/app/users/entities/user.entity';
import ACTION_ROLES from '../constant/action-roles';
import { seedAllPricingPackages } from './pricing-config.seed';
import { DEFAULT_ADMIN, seedAdmin } from './admin.seed';

const SEED_TENANT_NAME = 'Demo Tenant';
const SEED_OWNER_NAME = 'Owner Demo';
const SEED_OWNER_EMAIL = 'rizkijitu77@gmail.com';
const SEED_OWNER_PASSWORD = '11111111';
const SEED_ROLE_NAME = 'Owner';
const SEED_BRANCH_NAME = 'Cabang Utama';

async function run() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { monthly, biannual, annual } = await seedAllPricingPackages(
      queryRunner.manager,
    );
    console.log(
      `Seeded pricing_configs: monthly=${monthly.id} (${monthly.created ? 'created' : 'updated'}), biannual=${biannual.id} (${biannual.created ? 'created' : 'updated'}), annual=${annual.id} (${annual.created ? 'created' : 'updated'}).`,
    );

    const admin = await seedAdmin(queryRunner.manager);
    console.log(
      admin.created
        ? `Seeded admin: id=${admin.id}, email=${admin.email}, password=${DEFAULT_ADMIN.password}`
        : `Admin already exists: id=${admin.id}, email=${admin.email} (password tidak diubah)`,
    );

    const tenantRepo = queryRunner.manager.getRepository(TenantEntity);
    const branchRepo = queryRunner.manager.getRepository(BranchEntity);
    const roleRepo = queryRunner.manager.getRepository(RoleEntity);
    const userRepo = queryRunner.manager.getRepository(UserEntity);

    const existingOwner = await userRepo.findOne({
      where: { email: SEED_OWNER_EMAIL },
    });
    if (existingOwner) {
      console.log(`Owner "${SEED_OWNER_EMAIL}" already seeded. Skipping.`);
      await queryRunner.commitTransaction();
      return;
    }

    const tenant = tenantRepo.create({
      name: SEED_TENANT_NAME,
      ownerName: SEED_OWNER_NAME,
      ownerEmail: SEED_OWNER_EMAIL,
      status: 'trial',
      userQuota: 3,
      branchQuota: 1,
      onboardingCompleted: false,
    });
    await tenantRepo.save(tenant);

    const branch = branchRepo.create({
      name: SEED_BRANCH_NAME,
      tenantId: tenant.id,
    });
    await branchRepo.save(branch);

    const allPermissions = ACTION_ROLES.flatMap((m) =>
      m.actions.map((a) => a.value),
    );
    const role = roleRepo.create({
      name: SEED_ROLE_NAME,
      isAdmin: true,
      modules: allPermissions,
      tenant: { id: tenant.id } as TenantEntity,
    });
    await roleRepo.save(role);

    const hashedPassword = await bcrypt.hash(SEED_OWNER_PASSWORD, 10);
    const owner = userRepo.create({
      name: SEED_OWNER_NAME,
      email: SEED_OWNER_EMAIL,
      password: hashedPassword,
      isConfirmed: true,
      isOwner: true,
      tenant: { id: tenant.id } as TenantEntity,
      branch: { id: branch.id } as BranchEntity,
      role: { id: role.id } as RoleEntity,
    });
    await userRepo.save(owner);

    await queryRunner.commitTransaction();

    console.log('\nSeed completed:');
    console.log(`  tenant_id : ${tenant.id} (${SEED_TENANT_NAME})`);
    console.log(`  branch_id : ${branch.id} (${SEED_BRANCH_NAME})`);
    console.log(`  role_id   : ${role.id} (${SEED_ROLE_NAME}, isAdmin=true)`);
    console.log(`  user_id   : ${owner.id} (is_owner=true)`);
    console.log(`  email     : ${SEED_OWNER_EMAIL}`);
    console.log(`  password  : ${SEED_OWNER_PASSWORD}\n`);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

run();
