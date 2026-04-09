import type { NextFunction, Request, Response } from 'express';
import { createAuditLog } from '../auth/auth.repository.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './finance.service.js';

export const overviewHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const overview = await service.getOverview();

    await createAuditLog({
      userId: req.user?.id ?? null,
      action: 'FINANCE_OVERVIEW_READ',
      entity: 'FINANCE',
      entityId: null,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    sendSuccess(res, overview);
  } catch (error) {
    next(error);
  }
};

export const reportsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const period = (req.query.period as string) || 'monthly';

    if (period !== 'monthly') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Only period=monthly is supported' },
      });
      return;
    }

    const report = await service.getMonthlyReport(year);

    await createAuditLog({
      userId: req.user?.id ?? null,
      action: 'FINANCE_REPORT_READ',
      entity: 'FINANCE',
      entityId: null,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    sendSuccess(res, report);
  } catch (error) {
    next(error);
  }
};
