import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface FindAllFilters {
  orderId?: string | undefined;
  search?: string | undefined;
  cursor?: string | undefined;
  limit: number;
}

export const findAll = async (filters: FindAllFilters) => {
  const where: Prisma.ReturnWhereInput = {};
  if (filters.orderId) where.orderId = filters.orderId;
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { reason: { contains: q, mode: 'insensitive' } },
      { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.return.count({ where });

  const items = await prisma.return.findMany({
    where,
    include: { order: { select: { id: true, orderNumber: true, status: true } } },
    orderBy: { createdAt: 'desc' },
    take: filters.limit + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.return.findUnique({
    where: { id },
    include: { order: { select: { id: true, orderNumber: true, status: true } } },
  });
};
