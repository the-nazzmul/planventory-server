import type { ExpenseCategory, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface FindAllFilters {
  category?: ExpenseCategory | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  cursor?: string | undefined;
  limit: number;
}

export const findAll = async (filters: FindAllFilters) => {
  const where: Prisma.ExpenseWhereInput = {};

  if (filters.category) where.category = filters.category;
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  const total = await prisma.expense.count({ where });

  const items = await prisma.expense.findMany({
    where,
    include: { creator: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
    take: filters.limit + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.expense.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true } } },
  });
};

export const create = (data: Prisma.ExpenseUncheckedCreateInput) => {
  return prisma.expense.create({ data });
};
