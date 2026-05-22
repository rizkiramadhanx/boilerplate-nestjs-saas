import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';
import { AdminEntity } from '../modules/backoffice/admins/entities/admin.entity';

type AdminSeed = {
  name: string;
  email: string;
  password: string;
};

const DEFAULT_ADMIN: AdminSeed = {
  name: 'Super Admin',
  email: 'rizkijitu77@gmail.com',
  password: '11111111',
};

export async function seedAdmin(
  manager: EntityManager,
  payload: AdminSeed = DEFAULT_ADMIN,
): Promise<{ id: string; created: boolean; email: string }> {
  const repo = manager.getRepository(AdminEntity);
  const existing = await repo.findOne({ where: { email: payload.email } });
  if (existing) {
    return { id: existing.id, created: false, email: existing.email };
  }
  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const admin = repo.create({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
  });
  await repo.save(admin);
  return { id: admin.id, created: true, email: admin.email };
}

export { DEFAULT_ADMIN };
