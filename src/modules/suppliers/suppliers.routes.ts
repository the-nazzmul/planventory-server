import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createHandler,
  getAllHandler,
  getByIdHandler,
  softDeleteHandler,
  updateHandler,
} from './suppliers.controller.js';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.schema.js';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

suppliersRouter.get('/', getAllHandler);
suppliersRouter.get('/:id', getByIdHandler);
suppliersRouter.post('/', validate(createSupplierSchema), createHandler);
suppliersRouter.patch('/:id', validate(updateSupplierSchema), updateHandler);
suppliersRouter.delete('/:id', softDeleteHandler);
