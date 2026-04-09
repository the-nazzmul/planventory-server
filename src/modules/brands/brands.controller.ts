import type { NextFunction, Request, Response } from 'express';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './brands.service.js';

export const getAllHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brands = await service.getAll();
    sendSuccess(res, brands);
  } catch (error) {
    next(error);
  }
};

export const getByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brand = await service.getById(param(req.params.id));
    sendSuccess(res, brand);
  } catch (error) {
    next(error);
  }
};

export const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brand = await service.create(req.body);
    sendSuccess(res, brand, 201);
  } catch (error) {
    next(error);
  }
};

export const updateHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brand = await service.update(param(req.params.id), req.body);
    sendSuccess(res, brand);
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
