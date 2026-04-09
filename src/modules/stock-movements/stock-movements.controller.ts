import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './stock-movements.service.js';

export const getAllHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.getAll(req.query as never);
    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};
