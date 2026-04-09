import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../shared/schemas/common.js';
import { createHandler, getAllHandler, getByIdHandler } from './returns.controller.js';
import { createReturnSchema, getReturnsQuerySchema } from './returns.schema.js';

export const returnsRouter = Router();

returnsRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER'));

returnsRouter.get('/', validate(getReturnsQuerySchema), getAllHandler);
returnsRouter.get('/:id', validate(idParamSchema), getByIdHandler);
returnsRouter.post('/', validate(createReturnSchema), createHandler);
