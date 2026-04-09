import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { getAllHandler, updateHandler } from './settings.controller.js';
import { updateSettingSchema } from './settings.schema.js';

export const settingsRouter = Router();

settingsRouter.use(authenticate, authorize('SUPER_ADMIN'));

settingsRouter.get('/', getAllHandler);
settingsRouter.patch('/', validate(updateSettingSchema), updateHandler);
