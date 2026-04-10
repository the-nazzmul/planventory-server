import { Prisma, type StockMovementReason } from '@prisma/client';
import slugify from 'slugify';
import { randomBytes } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/errors/AppError.js';
import { getPresignedUploadUrl } from '../../lib/s3.js';
import { invalidateCacheNamespace, withCache } from '../../lib/cache.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './products.repository.js';

const generateSlug = async (name: string): Promise<string> => {
  let slug = slugify(name, { lower: true, strict: true });
  const existing = await repo.findBySlug(slug);
  if (existing) {
    slug = `${slug}-${randomBytes(2).toString('hex')}`;
  }
  return slug;
};

interface CreateProductInput {
  name: string;
  description?: string | null;
  brandId: string;
  categoryId: string;
  tags?: string[];
  variants: {
    sku: string;
    size?: string | null;
    color?: string | null;
    colorHex?: string | null;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    lowStockAlert: number;
    barcode?: string | null;
    weight?: number | null;
    dimensions?: Record<string, unknown> | null;
  }[];
}

export const getAll = async (filters: {
  cursor?: string;
  limit: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}) => {
  return withCache('products:list', 45, [filters], async () => {
    const { items, total } = await repo.findAll(filters);
    return buildPaginationMeta(items, filters.limit, total);
  });
};

export const getById = async (id: string) => {
  const product = await repo.findById(id);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  return product;
};

export const create = async (data: CreateProductInput) => {
  const slug = await generateSlug(data.name);
  const sku = data.variants[0]?.sku
    ? data.name.toUpperCase().replace(/\s+/g, '-').slice(0, 20)
    : data.name.toUpperCase().replace(/\s+/g, '-').slice(0, 20);

  const created = await repo.create({
    name: data.name,
    sku: `${sku}-${randomBytes(3).toString('hex').toUpperCase()}`,
    slug,
    description: data.description ?? null,
    brand: { connect: { id: data.brandId } },
    category: { connect: { id: data.categoryId } },
    tags: data.tags ?? [],
    variants: data.variants.map((v) => ({
      sku: v.sku,
      size: v.size ?? null,
      color: v.color ?? null,
      colorHex: v.colorHex ?? null,
      costPrice: v.costPrice,
      sellingPrice: v.sellingPrice,
      stock: v.stock,
      lowStockAlert: v.lowStockAlert,
      barcode: v.barcode ?? null,
      weight: v.weight ?? null,
      dimensions: v.dimensions ? (v.dimensions as Prisma.InputJsonValue) : Prisma.JsonNull,
    })),
  });
  await Promise.all([
    invalidateCacheNamespace('products:list'),
    invalidateCacheNamespace('stock-movements:list'),
    invalidateCacheNamespace('finance:overview'),
    invalidateCacheNamespace('finance:reports'),
  ]);
  return created;
};

export const update = async (id: string, data: Record<string, unknown>) => {
  await getById(id);
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = await generateSlug(data.name as string);
  }
  if (data.description !== undefined) updateData.description = data.description;
  if (data.brandId !== undefined) updateData.brand = { connect: { id: data.brandId } };
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await repo.update(id, updateData);
  await Promise.all([
    invalidateCacheNamespace('products:list'),
    invalidateCacheNamespace('finance:overview'),
  ]);
  return updated;
};

export const softDelete = async (id: string) => {
  await getById(id);
  const deleted = await repo.softDelete(id);
  await Promise.all([
    invalidateCacheNamespace('products:list'),
    invalidateCacheNamespace('finance:overview'),
  ]);
  return deleted;
};

export const addVariant = async (
  productId: string,
  data: {
    sku: string;
    size?: string | null;
    color?: string | null;
    colorHex?: string | null;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    lowStockAlert: number;
    barcode?: string | null;
    weight?: number | null;
    dimensions?: Record<string, unknown> | null;
  },
) => {
  await getById(productId);
  const variant = await repo.addVariant(productId, {
    productId,
    sku: data.sku,
    size: data.size ?? null,
    color: data.color ?? null,
    colorHex: data.colorHex ?? null,
    costPrice: data.costPrice,
    sellingPrice: data.sellingPrice,
    stock: data.stock,
    lowStockAlert: data.lowStockAlert,
    barcode: data.barcode ?? null,
    weight: data.weight ?? null,
    dimensions: data.dimensions ? (data.dimensions as Prisma.InputJsonValue) : Prisma.JsonNull,
  });
  await Promise.all([
    invalidateCacheNamespace('products:list'),
    invalidateCacheNamespace('stock-movements:list'),
    invalidateCacheNamespace('finance:overview'),
  ]);
  return variant;
};

export const updateVariant = async (variantId: string, data: Record<string, unknown>) => {
  const variant = await repo.findVariantById(variantId);
  if (!variant) {
    throw new AppError(404, 'VARIANT_NOT_FOUND', 'Product variant not found');
  }
  const updated = await repo.updateVariant(variantId, data);
  await Promise.all([
    invalidateCacheNamespace('products:list'),
    invalidateCacheNamespace('finance:overview'),
  ]);
  return updated;
};

export const updateStock = async (
  variantId: string,
  quantity: number,
  reason: StockMovementReason,
  performedBy: string,
  notes?: string,
) => {
  const variant = await repo.findVariantById(variantId);
  if (!variant) {
    throw new AppError(404, 'VARIANT_NOT_FOUND', 'Product variant not found');
  }
  const updated = await repo.updateStock(variantId, quantity, reason, performedBy, notes);
  await Promise.all([
    invalidateCacheNamespace('products:list'),
    invalidateCacheNamespace('stock-movements:list'),
    invalidateCacheNamespace('orders:list'),
    invalidateCacheNamespace('finance:overview'),
    invalidateCacheNamespace('finance:reports'),
  ]);
  return updated;
};

export const getPresignedImageUrl = async (productId: string, filename: string, contentType: string) => {
  await getById(productId);
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `products/${productId}/${uuidv4()}-${sanitized}`;
  return getPresignedUploadUrl(key, contentType);
};

export const addImage = async (
  productId: string,
  data: { url: string; altText?: string; position?: number; isPrimary?: boolean },
) => {
  await getById(productId);
  return repo.addImage(productId, data);
};

export const removeImage = async (imageId: string) => {
  const image = await repo.findImageById(imageId);
  if (!image) {
    throw new AppError(404, 'IMAGE_NOT_FOUND', 'Product image not found');
  }
  return repo.removeImage(imageId);
};
