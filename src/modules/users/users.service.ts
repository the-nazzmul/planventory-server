import type { Role } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { hashPassword } from '../../shared/utils/crypto.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './users.repository.js';

export const getAll = async (filters: { cursor?: string; limit: number; search?: string }) => {
  const { items, total } = await repo.findAll(filters);
  return buildPaginationMeta(items, filters.limit, total);
};

export const getById = async (id: string) => {
  const user = await repo.findById(id);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};

export const create = async (data: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) => {
  const passwordHash = await hashPassword(data.password);
  return repo.create({
    email: data.email,
    passwordHash,
    name: data.name,
    role: data.role,
  });
};

export const update = async (id: string, data: { name?: string; role?: Role; isActive?: boolean }) => {
  await getById(id);
  return repo.update(id, data);
};

export const remove = async (id: string) => {
  await getById(id);
  return repo.remove(id);
};
