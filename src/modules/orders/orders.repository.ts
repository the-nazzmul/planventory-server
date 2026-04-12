import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface FindAllFilters {
  status?: OrderStatus | undefined;
  customerEmail?: string | undefined;
  search?: string | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  cursor?: string | undefined;
  limit: number;
}

export const findAll = async (filters: FindAllFilters) => {
  const parts: Prisma.OrderWhereInput[] = [];

  if (filters.status) parts.push({ status: filters.status });
  if (filters.customerEmail) parts.push({ customerEmail: filters.customerEmail });
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
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.OrderWhereInput = parts.length > 0 ? { AND: parts } : {};

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
