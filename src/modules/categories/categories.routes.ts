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
} from './categories.controller.js';
import { createCategorySchema, updateCategorySchema } from './categories.schema.js';

export const categoriesRouter = Router();

categoriesRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

categoriesRouter.get('/', getAllHandler);
categoriesRouter.get('/:id', getByIdHandler);
categoriesRouter.post('/', validate(createCategorySchema), createHandler);
categoriesRouter.patch('/:id', validate(updateCategorySchema), updateHandler);
categoriesRouter.delete('/:id', removeHandler);
