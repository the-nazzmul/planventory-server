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
} from './users.controller.js';
import { createUserSchema, updateUserSchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.use(authenticate, authorize('SUPER_ADMIN'));

usersRouter.get('/', getAllHandler);
usersRouter.get('/:id', validate(idParamSchema), getByIdHandler);
usersRouter.post('/', validate(createUserSchema), createHandler);
usersRouter.patch('/:id', validate(updateUserSchema), updateHandler);
usersRouter.delete('/:id', validate(idParamSchema), removeHandler);
