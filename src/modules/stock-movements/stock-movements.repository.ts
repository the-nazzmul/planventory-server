import type { Prisma, StockMovementReason } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface Filters {
  variantId?: string | undefined;
  productId?: string | undefined;
  search?: string | undefined;
  reason?: StockMovementReason | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  cursor?: string | undefined;
  limit: number;
}

export const findAll = async (filters: Filters) => {
  const parts: Prisma.StockMovementWhereInput[] = [];

  if (filters.variantId) parts.push({ variantId: filters.variantId });
  if (filters.productId) parts.push({ variant: { productId: filters.productId } });
  if (filters.reason) parts.push({ reason: filters.reason });
  if (filters.dateFrom || filters.dateTo) {
    parts.push({
      createdAt: {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      },
    });
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    parts.push({
      OR: [
        { variant: { sku: { contains: q, mode: 'insensitive' } } },
        { variant: { product: { name: { contains: q, mode: 'insensitive' } } } },
      ],
    });
  }

  const where: Prisma.StockMovementWhereInput = parts.length > 0 ? { AND: parts } : {};

  const total = await prisma.stockMovement.count({ where });

  const items = await prisma.stockMovement.findMany({
    where,
    include: {
      variant: { include: { product: { select: { id: true, name: true, sku: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit + 1,
    ...(filters.cursor
      ? { cursor: { id: filters.cursor }, skip: 1 }
      : {}),
  });

  return { items, total };
};
