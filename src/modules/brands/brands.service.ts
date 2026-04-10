import slugify from 'slugify';
import { randomBytes } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './brands.repository.js';

const generateSlug = async (name: string): Promise<string> => {
  let slug = slugify(name, { lower: true, strict: true });
  const existing = await repo.findBySlug(slug);
  if (existing) {
    slug = `${slug}-${randomBytes(2).toString('hex')}`;
  }
  return slug;
};

export const getAll = async (filters: { cursor?: string; limit: number; search?: string }) => {
  const { items, total } = await repo.findAll(filters);
  return buildPaginationMeta(items, filters.limit, total);
};

export const getById = async (id: string) => {
  const brand = await repo.findById(id);
  if (!brand) {
    throw new AppError(404, 'BRAND_NOT_FOUND', 'Brand not found');
  }
  return brand;
};

export const create = async (data: { name: string; logoUrl?: string | null }) => {
  const slug = await generateSlug(data.name);
  return repo.create({ name: data.name, slug, logoUrl: data.logoUrl ?? null });
};

export const update = async (id: string, data: { name?: string; logoUrl?: string | null }) => {
  await getById(id);
  const updateData: { name?: string; slug?: string; logoUrl?: string | null } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = await generateSlug(data.name);
  }
  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl;
  }

  return repo.update(id, updateData);
};

export const remove = async (id: string) => {
  await getById(id);
  const count = await repo.countProducts(id);
  if (count > 0) {
    throw new AppError(409, 'BRAND_HAS_PRODUCTS', 'Cannot delete brand with linked products');
  }
  return repo.remove(id);
};
