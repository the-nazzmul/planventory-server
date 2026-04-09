import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { financeLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import { createHandler, getAllHandler, getByIdHandler } from './expenses.controller.js';
import { createExpenseSchema, getExpensesQuerySchema } from './expenses.schema.js';

export const expensesRouter = Router();

expensesRouter.use(authenticate, authorize('SUPER_ADMIN'), financeLimiter);

expensesRouter.get('/', validate(getExpensesQuerySchema), getAllHandler);
expensesRouter.get('/:id', getByIdHandler);
expensesRouter.post('/', validate(createExpenseSchema), createHandler);
