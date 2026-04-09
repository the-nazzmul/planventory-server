import type { NextFunction, Request, Response } from 'express';
import logger from '../shared/utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
      userId: req.user?.id,
    });
  });

  next();
};
