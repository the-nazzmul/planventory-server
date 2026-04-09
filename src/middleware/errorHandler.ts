import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/AppError.js';
import logger from '../shared/utils/logger.js';
import { sendError } from '../shared/utils/response.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  logger.error('Unhandled error', { err });
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
};
