import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { getAllHandler } from './stock-movements.controller.js';
import { getStockMovementsQuerySchema } from './stock-movements.schema.js';

export const stockMovementsRouter = Router();

stockMovementsRouter.use(authenticate, authorize('SUPER_ADMIN', 'MANAGER', 'WAREHOUSE'));

stockMovementsRouter.get('/', validate(getStockMovementsQuerySchema), getAllHandler);
