import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { financeLimiter } from '../../middleware/rateLimiter.js';
import { overviewHandler, reportsHandler } from './finance.controller.js';

export const financeRouter = Router();

financeRouter.use(authenticate, authorize('SUPER_ADMIN'), financeLimiter);

financeRouter.get('/overview', overviewHandler);
financeRouter.get('/reports', reportsHandler);
