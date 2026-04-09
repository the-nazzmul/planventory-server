import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface FindAllFilters {
  status?: OrderStatus | undefined;
  customerEmail?: string | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  cursor?: string | undefined;
  limit: number;
}

export const findAll = async (filters: FindAllFilters) => {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.customerEmail) where.customerEmail = filters.customerEmail;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  const total = await prisma.order.count({ where });

  const items = await prisma.order.findMany({
    where,
    include: {
      items: { include: { variant: { include: { product: { select: { id: true, name: true } } } } } },
      processor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: { select: { id: true, name: true, sku: true } } } } } },
      processor: { select: { id: true, name: true } },
      returns: true,
    },
  });
};

export const findByIdempotencyKey = (key: string) => {
  return prisma.order.findUnique({
    where: { idempotencyKey: key },
    include: {
      items: { include: { variant: true } },
    },
  });
};

export const findItemsByOrderId = (orderId: string) => {
  return prisma.orderItem.findMany({
    where: { orderId },
    include: { variant: { include: { product: { select: { id: true, name: true } } } } },
  });
};
