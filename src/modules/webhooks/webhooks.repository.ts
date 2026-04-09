import type { WebhookEvent } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export const findAll = () => {
  return prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
};

export const findById = (id: string) => {
  return prisma.webhook.findUnique({ where: { id } });
};

export const create = (data: { url: string; events: WebhookEvent[]; secret: string }) => {
  return prisma.webhook.create({ data });
};

export const remove = (id: string) => {
  return prisma.webhook.delete({ where: { id } });
};
