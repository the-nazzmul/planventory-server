import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createHandler,
  getAllHandler,
  getByIdHandler,
  getItemsHandler,
  updateStatusHandler,
} from './orders.controller.js';
import { createOrderSchema, getOrdersQuerySchema, updateOrderStatusSchema } from './orders.schema.js';

export const ordersRouter = Router();

ordersRouter.use(authenticate);

const adminOrManager = authorize('SUPER_ADMIN', 'MANAGER');
const allRoles = authorize('SUPER_ADMIN', 'MANAGER', 'WAREHOUSE');

ordersRouter.get('/', allRoles, validate(getOrdersQuerySchema), getAllHandler);
ordersRouter.get('/:id', allRoles, getByIdHandler);
ordersRouter.post('/', adminOrManager, validate(createOrderSchema), createHandler);
ordersRouter.patch('/:id/status', allRoles, validate(updateOrderStatusSchema), updateStatusHandler);
ordersRouter.get('/:id/items', allRoles, getItemsHandler);
