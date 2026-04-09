import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createHandler,
  getAllHandler,
  getByIdHandler,
  receiveHandler,
  updateHandler,
} from './purchase-orders.controller.js';
import {
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from './purchase-orders.schema.js';

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

purchaseOrdersRouter.get('/', getAllHandler);
purchaseOrdersRouter.get('/:id', getByIdHandler);
purchaseOrdersRouter.post('/', validate(createPurchaseOrderSchema), createHandler);
purchaseOrdersRouter.patch('/:id', validate(updatePurchaseOrderSchema), updateHandler);
purchaseOrdersRouter.post('/:id/receive', validate(receivePurchaseOrderSchema), receiveHandler);
