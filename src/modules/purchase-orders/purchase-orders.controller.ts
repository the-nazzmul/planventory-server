import type { NextFunction, Request, Response } from 'express';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './purchase-orders.service.js';

export const getAllHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await service.getAll();
    sendSuccess(res, orders);
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
    const order = await service.create(req.body);
    sendSuccess(res, order, 201);
  } catch (error) {
    next(error);
  }
};

export const updateHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await service.update(param(req.params.id), req.body);
    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};

export const receiveHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('Unauthenticated');
    }
    const order = await service.receivePurchaseOrder(param(req.params.id), req.body.items, req.user.id);
    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};
