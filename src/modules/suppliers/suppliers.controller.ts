import type { NextFunction, Request, Response } from 'express';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './suppliers.service.js';

export const getAllHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.getAll(req.query as never);
    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await service.getById(param(req.params.id));
    sendSuccess(res, supplier);
  } catch (error) {
    next(error);
  }
};

export const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await service.create(req.body);
    sendSuccess(res, supplier, 201);
  } catch (error) {
    next(error);
  }
};

export const updateHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await service.update(param(req.params.id), req.body);
    sendSuccess(res, supplier);
  } catch (error) {
    next(error);
  }
};

export const softDeleteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await service.softDelete(param(req.params.id));
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};
