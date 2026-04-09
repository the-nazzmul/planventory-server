import type { WebhookEvent } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';

export const getAll = () => {
  return prisma.webhook.findMany({ orderBy: { createdAt: 'desc' } });
};

export const getById = async (id: string) => {
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook) {
    throw new AppError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
  }
  return webhook;
};

export const create = async (data: { url: string; events: WebhookEvent[] }) => {
  const secret = randomBytes(32).toString('hex');
  return prisma.webhook.create({
    data: {
      url: data.url,
      events: data.events,
      secret,
    },
  });
};

export const remove = async (id: string) => {
  await getById(id);
  return prisma.webhook.delete({ where: { id } });
};
