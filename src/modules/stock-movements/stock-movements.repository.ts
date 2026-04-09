import type { Prisma, StockMovementReason } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface Filters {
  variantId?: string | undefined;
  productId?: string | undefined;
  reason?: StockMovementReason | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  cursor?: string | undefined;
  limit: number;
}

export const findAll = async (filters: Filters) => {
  const where: Prisma.StockMovementWhereInput = {};

  if (filters.variantId) where.variantId = filters.variantId;
  if (filters.productId) where.variant = { productId: filters.productId };
  if (filters.reason) where.reason = filters.reason;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

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
