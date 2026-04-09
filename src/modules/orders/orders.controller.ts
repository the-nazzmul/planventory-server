import type { NextFunction, Request, Response } from 'express';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './orders.service.js';

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
    const order = await service.getById(param(req.params.id));
    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};

export const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await service.create(req.body, req.user?.id);
    sendSuccess(res, order, 201);
  } catch (error) {
    next(error);
  }
};

export const updateStatusHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await service.updateStatus(
      param(req.params.id),
      req.body.status,
      req.body.trackingNumber,
      req.user?.id,
    );
    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};

export const getItemsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await service.getItems(param(req.params.id));
    sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
};
