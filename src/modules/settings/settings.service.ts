import type { Prisma } from '@prisma/client';
import * as repo from './settings.repository.js';

export const getAll = async () => {
  const settings = await repo.findAll();
  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
};

export const upsert = async (key: string, value: unknown) => {
  return repo.upsert(key, value as Prisma.InputJsonValue);
};
