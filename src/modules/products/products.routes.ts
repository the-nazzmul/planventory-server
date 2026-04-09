import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import {
  addImageHandler,
  addVariantHandler,
  createHandler,
  getAllHandler,
  getByIdHandler,
  presignedUploadHandler,
  removeImageHandler,
  softDeleteHandler,
  updateHandler,
  updateStockHandler,
  updateVariantHandler,
} from './products.controller.js';
import {
  addImageSchema,
  createProductSchema,
  createVariantSchema,
  getProductsQuerySchema,
  presignedUploadQuerySchema,
  updateProductSchema,
  updateStockSchema,
  updateVariantSchema,
} from './products.schema.js';

export const productsRouter = Router();

productsRouter.use(authenticate);

const adminOrManager = authorize('SUPER_ADMIN', 'MANAGER');
const adminManagerOrWarehouse = authorize('SUPER_ADMIN', 'MANAGER', 'WAREHOUSE');

productsRouter.get('/', adminOrManager, validate(getProductsQuerySchema), getAllHandler);
productsRouter.get('/:id', adminOrManager, getByIdHandler);
productsRouter.post('/', adminOrManager, validate(createProductSchema), createHandler);
productsRouter.patch('/:id', adminOrManager, validate(updateProductSchema), updateHandler);
productsRouter.delete('/:id', adminOrManager, softDeleteHandler);

productsRouter.post('/:id/variants', adminOrManager, validate(createVariantSchema), addVariantHandler);
productsRouter.patch('/:id/variants/:variantId', adminOrManager, validate(updateVariantSchema), updateVariantHandler);
productsRouter.patch('/:id/variants/:variantId/stock', adminManagerOrWarehouse, validate(updateStockSchema), updateStockHandler);

productsRouter.get('/:id/presigned-upload', adminOrManager, validate(presignedUploadQuerySchema), presignedUploadHandler);
productsRouter.post('/:id/images', adminOrManager, validate(addImageSchema), addImageHandler);
productsRouter.delete('/:id/images/:imageId', adminOrManager, removeImageHandler);
