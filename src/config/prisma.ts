import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './env.js';

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };
const pool = new Pool({ connectionString: env.DIRECT_URL });
const adapter = new PrismaPg(pool);

export const prisma =
  prismaGlobal.prisma ??
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
}
