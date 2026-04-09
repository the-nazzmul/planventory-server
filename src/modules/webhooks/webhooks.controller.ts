import type { NextFunction, Request, Response } from 'express';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './webhooks.service.js';

export const getAllHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const webhooks = await service.getAll();
    sendSuccess(res, webhooks);
  } catch (error) {
    next(error);
  }
};

export const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const webhook = await service.create(req.body);
    sendSuccess(res, webhook, 201);
  } catch (error) {
    next(error);
  }
};

export const removeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await service.remove(param(req.params.id));
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};
