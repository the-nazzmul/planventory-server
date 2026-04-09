import type { NextFunction, Request, Response } from 'express';
import { createAuditLog } from '../auth/auth.repository.js';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './expenses.service.js';

export const getAllHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.getAll(req.query as never);

    await createAuditLog({
      userId: req.user?.id ?? null,
      action: 'EXPENSES_LIST_READ',
      entity: 'EXPENSE',
      entityId: null,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = param(req.params.id);
    const expense = await service.getById(id);

    await createAuditLog({
      userId: req.user?.id ?? null,
      action: 'EXPENSE_READ',
      entity: 'EXPENSE',
      entityId: id,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    sendSuccess(res, expense);
  } catch (error) {
    next(error);
  }
};

export const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('Unauthenticated');
    }
    const expense = await service.create(req.body, req.user.id);
    sendSuccess(res, expense, 201);
  } catch (error) {
    next(error);
  }
};
