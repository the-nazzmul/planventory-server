import type { ExpenseCategory } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { invalidateCacheNamespace, withCache } from '../../lib/cache.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './expenses.repository.js';

export const getAll = async (filters: Parameters<typeof repo.findAll>[0]) => {
  return withCache('expenses:list', 45, [filters], async () => {
    const { items, total } = await repo.findAll(filters);
    return buildPaginationMeta(items, filters.limit, total);
  });
};

export const getById = async (id: string) => {
  const expense = await repo.findById(id);
  if (!expense) {
    throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found');
  }
  return expense;
};

export const create = async (data: {
  amount: number;
  category: ExpenseCategory;
  description: string;
  reference?: string | null;
  date: Date;
}, createdBy: string) => {
  const created = await repo.create({
    amount: data.amount,
    category: data.category,
    description: data.description,
    reference: data.reference ?? null,
    date: data.date,
    createdBy,
  });
  await Promise.all([
    invalidateCacheNamespace('expenses:list'),
    invalidateCacheNamespace('finance:overview'),
    invalidateCacheNamespace('finance:reports'),
  ]);
  return created;
};
