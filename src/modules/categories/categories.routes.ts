import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../shared/schemas/common.js';
import {
  createHandler,
  getAllHandler,
  getByIdHandler,
  removeHandler,
  updateHandler,
} from './categories.controller.js';
import { createCategorySchema, getCategoriesQuerySchema, updateCategorySchema } from './categories.schema.js';

export const categoriesRouter = Router();

categoriesRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

categoriesRouter.get('/', validate(getCategoriesQuerySchema), getAllHandler);
categoriesRouter.get('/:id', validate(idParamSchema), getByIdHandler);
categoriesRouter.post('/', validate(createCategorySchema), createHandler);
categoriesRouter.patch('/:id', validate(updateCategorySchema), updateHandler);
categoriesRouter.delete('/:id', validate(idParamSchema), removeHandler);
