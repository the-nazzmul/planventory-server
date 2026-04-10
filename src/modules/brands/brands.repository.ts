import { prisma } from '../../config/prisma.js';

type BrandFilters = {
  cursor?: string;
  limit: number;
  search?: string;
};

export const findAll = async (filters: BrandFilters) => {
  const where = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { slug: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
      take: filters.limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    }),
    prisma.brand.count({ where }),
  ]);

  return { items, total };
};

export const findById = (id: string) => {
  return prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
};

export const findBySlug = (slug: string) => {
  return prisma.brand.findUnique({ where: { slug } });
};

export const create = (data: { name: string; slug: string; logoUrl?: string | null }) => {
  return prisma.brand.create({
    data: {
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl ?? null,
    },
  });
};

export const update = (id: string, data: { name?: string; slug?: string; logoUrl?: string | null }) => {
  return prisma.brand.update({ where: { id }, data });
};

export const remove = (id: string) => {
  return prisma.brand.delete({ where: { id } });
};

export const countProducts = (id: string) => {
  return prisma.product.count({ where: { brandId: id } });
};
