import cron from 'node-cron';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { checkLowStock } from './jobs/lowStockNotifier.js';

const main = async (): Promise<void> => {
  await prisma.$connect();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);

    cron.schedule('0 * * * *', () => {
      void checkLowStock();
    });
  });
};

main().catch(async (error: unknown) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});
