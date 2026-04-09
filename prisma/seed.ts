import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const passwordHash = await argon2.hash('SuperAdmin@2025!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { email: 'admin@planventory.com' },
    update: {},
    create: {
      email: 'admin@planventory.com',
      passwordHash,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const defaultSettings: { key: string; value: string | number }[] = [
    { key: 'low_stock_threshold', value: 10 },
    { key: 'tax_rate', value: 0 },
    { key: 'currency_code', value: 'USD' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log('Seed completed: SUPER_ADMIN user and default settings created');
};

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
