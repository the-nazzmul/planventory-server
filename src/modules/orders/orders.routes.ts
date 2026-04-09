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

ordersRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

ordersRouter.get('/', validate(getOrdersQuerySchema), getAllHandler);
ordersRouter.get('/:id', getByIdHandler);
ordersRouter.post('/', validate(createOrderSchema), createHandler);
ordersRouter.patch('/:id/status', validate(updateOrderStatusSchema), updateStatusHandler);
ordersRouter.get('/:id/items', getItemsHandler);
