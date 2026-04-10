import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

type SupplierFilters = {
  cursor?: string;
  limit: number;
  search?: string;
};

export const findAll = async (filters: SupplierFilters) => {
  const where = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
          { phone: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { purchaseOrders: true } } },
      orderBy: { name: 'asc' },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    }),
    prisma.supplier.count({ where }),
  ]);

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { purchaseOrders: true } } },
  });
};

export const create = (data: Prisma.SupplierCreateInput) => {
  return prisma.supplier.create({ data });
};

export const update = (id: string, data: Prisma.SupplierUpdateInput) => {
  return prisma.supplier.update({ where: { id }, data });
};

export const softDelete = (id: string) => {
  return prisma.supplier.update({ where: { id }, data: { isActive: false } });
};
