import type { NextFunction, Request, Response } from 'express';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import * as service from './health.service.js';

export const healthCheckHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.checkHealth();

    if (!result.healthy) {
      sendError(res, 503, 'SERVICE_UNAVAILABLE', 'One or more services are unavailable', {
        db: result.db,
        redis: result.redis,
      });
      return;
    }

    sendSuccess(res, { status: 'ok', db: result.db, redis: result.redis });
  } catch (error) {
    next(error);
  }
};
