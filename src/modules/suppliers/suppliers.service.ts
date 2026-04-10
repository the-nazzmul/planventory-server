import type { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './suppliers.repository.js';

export const getAll = async (filters: { cursor?: string; limit: number; search?: string }) => {
  const { items, total } = await repo.findAll(filters);
  return buildPaginationMeta(items, filters.limit, total);
};

export const getById = async (id: string) => {
  const supplier = await repo.findById(id);
  if (!supplier) {
    throw new AppError(404, 'SUPPLIER_NOT_FOUND', 'Supplier not found');
  }
  return supplier;
};

export const create = (data: Prisma.SupplierCreateInput) => {
  return repo.create(data);
};

export const update = async (id: string, data: Prisma.SupplierUpdateInput) => {
  await getById(id);
  return repo.update(id, data);
};

export const softDelete = async (id: string) => {
  await getById(id);
  return repo.softDelete(id);
};
