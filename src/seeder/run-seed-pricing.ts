import dataSource from '../config/typeorm.config';
import { seedAllPricingPackages } from './pricing-config.seed';

async function run() {
  await dataSource.initialize();
  try {
    const { monthly, biannual, annual } = await seedAllPricingPackages(
      dataSource.manager,
    );
    console.log(
      `Pricing seeded: monthly=${monthly.id} (${monthly.created ? 'created' : 'updated'}), biannual=${biannual.id} (${biannual.created ? 'created' : 'updated'}), annual=${annual.id} (${annual.created ? 'created' : 'updated'})`,
    );
  } catch (err) {
    console.error('Seed pricing failed:', err);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
