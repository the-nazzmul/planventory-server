import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';

export const pingDatabase = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export const pingRedis = async (): Promise<boolean> => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
};
