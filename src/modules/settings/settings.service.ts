import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const getAll = async () => {
  const settings = await prisma.setting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
};

export const upsert = async (key: string, value: unknown) => {
  return prisma.setting.upsert({
    where: { key },
    update: { value: value as Prisma.InputJsonValue },
    create: { key, value: value as Prisma.InputJsonValue },
  });
};
