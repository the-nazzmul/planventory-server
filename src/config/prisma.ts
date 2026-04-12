import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './env.js';

/**
 * Use DATABASE_URL (pooled / PgBouncer) at runtime. DIRECT_URL is for Prisma
 * migrations (prisma.config.ts) and direct connections — using it for every
 * request often triggers "Authentication timed out" on Neon and similar hosts.
 */
const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 20_000,
});
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
