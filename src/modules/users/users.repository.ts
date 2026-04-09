import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const findById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
};

export const create = (data: Prisma.UserCreateInput) => {
  return prisma.user.create({
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
};

export const update = (id: string, data: Prisma.UserUpdateInput) => {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
};

export const remove = (id: string) => {
  return prisma.user.delete({ where: { id } });
};
