import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../shared/schemas/common.js';
import { createHandler, getAllHandler, getByIdHandler } from './expenses.controller.js';
import { createExpenseSchema, getExpensesQuerySchema } from './expenses.schema.js';

export const expensesRouter = Router();

expensesRouter.use(authenticate, authorize('SUPER_ADMIN'));

expensesRouter.get('/', validate(getExpensesQuerySchema), getAllHandler);
expensesRouter.get('/:id', validate(idParamSchema), getByIdHandler);
expensesRouter.post('/', validate(createExpenseSchema), createHandler);
