import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.supplier.findMany({
    include: { _count: { select: { purchaseOrders: true } } },
    orderBy: { name: 'asc' },
  });
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
