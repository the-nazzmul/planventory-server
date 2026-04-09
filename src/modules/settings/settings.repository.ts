import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.setting.findMany();
};

export const upsert = (key: string, value: Prisma.InputJsonValue) => {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};
