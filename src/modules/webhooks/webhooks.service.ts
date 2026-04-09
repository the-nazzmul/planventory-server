import type { WebhookEvent } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { AppError } from '../../shared/errors/AppError.js';
import * as repo from './webhooks.repository.js';

export const getAll = () => {
  return repo.findAll();
};

export const getById = async (id: string) => {
  const webhook = await repo.findById(id);
  if (!webhook) {
    throw new AppError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
  }
  return webhook;
};

export const create = async (data: { url: string; events: WebhookEvent[] }) => {
  const secret = randomBytes(32).toString('hex');
  return repo.create({
    url: data.url,
    events: data.events,
    secret,
  });
};

export const remove = async (id: string) => {
  await getById(id);
  return repo.remove(id);
};
