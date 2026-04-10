import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

type UserFilters = {
  cursor?: string;
  limit: number;
  search?: string;
};

export const findAll = async (filters: UserFilters) => {
  const where = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const select = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select,
      orderBy: { createdAt: 'desc' },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
};

export const create = (data: Prisma.UserCreateInput) => {
  return prisma.user.create({
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
};

export const update = (id: string, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
};

export const remove = (id: string) => {
  return prisma.user.delete({ where: { id } });
};
