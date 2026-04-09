import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../shared/schemas/common.js';
import { createHandler, getAllHandler, removeHandler } from './webhooks.controller.js';
import { createWebhookSchema } from './webhooks.schema.js';

export const webhooksRouter = Router();

webhooksRouter.use(authenticate, authorize('SUPER_ADMIN'));

webhooksRouter.get('/', getAllHandler);
webhooksRouter.post('/', validate(createWebhookSchema), createHandler);
webhooksRouter.delete('/:id', validate(idParamSchema), removeHandler);
