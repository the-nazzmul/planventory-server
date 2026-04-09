import slugify from 'slugify';
import { randomBytes } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError.js';
import * as repo from './categories.repository.js';

const generateSlug = async (name: string): Promise<string> => {
  let slug = slugify(name, { lower: true, strict: true });
  const existing = await repo.findBySlug(slug);
  if (existing) {
    slug = `${slug}-${randomBytes(2).toString('hex')}`;
  }
  return slug;
};

export const getAll = () => repo.findAll();

export const getById = async (id: string) => {
  const category = await repo.findById(id);
  if (!category) {
    throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
  }
  return category;
};

export const create = async (data: { name: string; parentId?: string | null }) => {
  const slug = await generateSlug(data.name);
  return repo.create({ name: data.name, slug, parentId: data.parentId ?? null });
};

export const update = async (id: string, data: { name?: string; parentId?: string | null }) => {
  await getById(id);
  const updateData: { name?: string; slug?: string; parentId?: string | null } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = await generateSlug(data.name);
  }
  if (data.parentId !== undefined) {
    updateData.parentId = data.parentId;
  }

  return repo.update(id, updateData);
};

export const remove = async (id: string) => {
  await getById(id);
  const count = await repo.countProducts(id);
  if (count > 0) {
    throw new AppError(409, 'CATEGORY_HAS_PRODUCTS', 'Cannot delete category with linked products');
  }
  return repo.remove(id);
};
