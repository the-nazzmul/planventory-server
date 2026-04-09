import type { Prisma, StockMovementReason } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

interface FindAllFilters {
  cursor?: string | undefined;
  limit: number;
  search?: string | undefined;
  categoryId?: string | undefined;
  brandId?: string | undefined;
  isActive?: boolean | undefined;
}

export const findAll = async (filters: FindAllFilters) => {
  const where: Prisma.ProductWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  const total = await prisma.product.count({ where });

  const items = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
      variants: true,
      images: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit + 1,
    ...(filters.cursor
      ? { cursor: { id: filters.cursor }, skip: 1 }
      : {}),
  });

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      variants: true,
      images: { orderBy: { position: 'asc' } },
    },
  });
};

export const findBySku = (sku: string) => {
  return prisma.product.findUnique({ where: { sku } });
};

export const findBySlug = (slug: string) => {
  return prisma.product.findUnique({ where: { slug } });
};

export const create = (
  data: Prisma.ProductCreateInput & { variants: Prisma.ProductVariantCreateWithoutProductInput[] },
) => {
  const { variants, ...productData } = data;
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        ...productData,
        variants: {
          create: variants,
        },
      },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: true,
      },
    });
    return product;
  });
};

export const update = (id: string, data: Prisma.ProductUpdateInput) => {
  return prisma.product.update({
    where: { id },
    data,
    include: {
      brand: true,
      category: true,
      variants: true,
      images: true,
    },
  });
};

export const softDelete = (id: string) => {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
};

export const addVariant = (productId: string, data: Prisma.ProductVariantUncheckedCreateInput) => {
  return prisma.productVariant.create({
    data: { ...data, productId },
  });
};

export const updateVariant = (variantId: string, data: Prisma.ProductVariantUpdateInput) => {
  return prisma.productVariant.update({
    where: { id: variantId },
    data,
  });
};

export const findVariantById = (variantId: string) => {
  return prisma.productVariant.findUnique({ where: { id: variantId } });
};

export const updateStock = async (
  variantId: string,
  quantity: number,
  reason: StockMovementReason,
  performedBy: string,
  notes?: string,
) => {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: quantity } },
    });

    await tx.stockMovement.create({
      data: {
        variantId,
        quantity,
        reason,
        performedBy,
        notes: notes ?? null,
      },
    });

    return variant;
  });
};

export const addImage = (productId: string, data: { url: string; altText?: string; position?: number; isPrimary?: boolean }) => {
  return prisma.productImage.create({
    data: {
      productId,
      url: data.url,
      altText: data.altText ?? null,
      position: data.position ?? 0,
      isPrimary: data.isPrimary ?? false,
    },
  });
};

export const removeImage = (imageId: string) => {
  return prisma.productImage.delete({ where: { id: imageId } });
};

export const findImageById = (imageId: string) => {
  return prisma.productImage.findUnique({ where: { id: imageId } });
};
