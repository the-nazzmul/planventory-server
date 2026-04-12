import type { NextFunction, Request, Response } from 'express';
import { sendError, sendSuccess } from '../../shared/utils/response.js';
import * as service from './health.service.js';

/** Fast response for load balancers (Render, etc.). Do not ping DB/Redis here. */
export const livenessHandler = (_req: Request, res: Response): void => {
  sendSuccess(res, { status: 'ok' });
};

/** Full dependency check (database + Redis). Use for monitoring or readiness probes. */
export const readinessHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
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
