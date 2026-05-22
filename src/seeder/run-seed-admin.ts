import dataSource from '../config/typeorm.config';
import { DEFAULT_ADMIN, seedAdmin } from './admin.seed';

async function run() {
  await dataSource.initialize();
  try {
    const { id, created, email } = await seedAdmin(dataSource.manager);
    console.log(
      created
        ? `Admin created: id=${id}, email=${email}, password=${DEFAULT_ADMIN.password}`
        : `Admin already exists: id=${id}, email=${email} (password tidak diubah)`,
    );
  } catch (err) {
    console.error('Seed admin failed:', err);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
