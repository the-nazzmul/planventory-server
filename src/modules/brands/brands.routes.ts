import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  createHandler,
  getAllHandler,
  getByIdHandler,
  removeHandler,
  updateHandler,
} from './brands.controller.js';
import { createBrandSchema, updateBrandSchema } from './brands.schema.js';

export const brandsRouter = Router();

brandsRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

brandsRouter.get('/', getAllHandler);
brandsRouter.get('/:id', getByIdHandler);
brandsRouter.post('/', validate(createBrandSchema), createHandler);
brandsRouter.patch('/:id', validate(updateBrandSchema), updateHandler);
brandsRouter.delete('/:id', removeHandler);
