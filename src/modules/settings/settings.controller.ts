import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './settings.service.js';

export const getAllHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await service.getAll();
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const updateHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const setting = await service.upsert(req.body.key, req.body.value);
    sendSuccess(res, setting);
  } catch (error) {
    next(error);
  }
};
