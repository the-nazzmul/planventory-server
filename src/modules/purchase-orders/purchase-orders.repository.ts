import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      items: { include: { variant: { include: { product: { select: { id: true, name: true } } } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findById = (id: string) => {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { variant: { include: { product: { select: { id: true, name: true } } } } } },
    },
  });
};

export const create = (
  data: {
    supplierId: string;
    notes?: string | null;
    totalAmount: number;
    status: string;
    orderedAt?: Date | null;
    items: { variantId: string; quantity: number; unitCost: number }[];
  },
) => {
  return prisma.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      notes: data.notes ?? null,
      totalAmount: data.totalAmount,
      status: data.status,
      orderedAt: data.orderedAt ?? null,
      items: {
        create: data.items,
      },
    },
    include: {
      supplier: true,
      items: { include: { variant: true } },
    },
  });
};

export const update = (id: string, data: Prisma.PurchaseOrderUpdateInput) => {
  return prisma.purchaseOrder.update({
    where: { id },
    data,
    include: {
      supplier: true,
      items: { include: { variant: true } },
    },
  });
};

export const remove = (id: string) => {
  return prisma.purchaseOrder.delete({ where: { id } });
};
