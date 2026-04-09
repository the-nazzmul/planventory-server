import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './finance.service.js';

export const overviewHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const overview = await service.getOverview();
    sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
};

export const reportsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const report = await service.getMonthlyReport(year);
    sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
};
