import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
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
