import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, { status: 'ok' });
  } catch {
    sendError(res, 503, 'DB_UNAVAILABLE', 'Database is unavailable');
  }
});
