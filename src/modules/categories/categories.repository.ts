import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.category.findMany({
    include: { children: true, parent: true, _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
};

export const findById = (id: string) => {
  return prisma.category.findUnique({
    where: { id },
    include: { children: true, parent: true, _count: { select: { products: true } } },
  });
};

export const findBySlug = (slug: string) => {
  return prisma.category.findUnique({ where: { slug } });
};

export const create = (data: { name: string; slug: string; parentId?: string | null }) => {
  return prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId ?? null,
    },
  });
};

export const update = (id: string, data: { name?: string; slug?: string; parentId?: string | null }) => {
  return prisma.category.update({
    where: { id },
    data,
  });
};

export const remove = (id: string) => {
  return prisma.category.delete({ where: { id } });
};

export const countProducts = (id: string) => {
  return prisma.product.count({ where: { categoryId: id } });
};

export const findDescendantIds = async (id: string): Promise<string[]> => {
  const children = await prisma.category.findMany({
    where: { parentId: id },
    select: { id: true },
  });

  const ids: string[] = [];
  for (const child of children) {
    ids.push(child.id);
    const grandchildren = await findDescendantIds(child.id);
    ids.push(...grandchildren);
  }
  return ids;
};

export const countProductsInTree = async (id: string) => {
  const descendantIds = await findDescendantIds(id);
  const allIds = [id, ...descendantIds];
  return prisma.product.count({ where: { categoryId: { in: allIds } } });
};
