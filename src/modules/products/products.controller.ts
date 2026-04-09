import type { NextFunction, Request, Response } from 'express';
import { param } from '../../shared/utils/params.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as service from './products.service.js';

export const getAllHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.getAll(req.query as never);
    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await service.getById(param(req.params.id));
    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

export const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await service.create(req.body);
    sendSuccess(res, product, 201);
  } catch (error) {
    next(error);
  }
};

export const updateHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await service.update(param(req.params.id), req.body);
    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

export const softDeleteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await service.softDelete(param(req.params.id));
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

export const addVariantHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const variant = await service.addVariant(param(req.params.id), req.body);
    sendSuccess(res, variant, 201);
  } catch (error) {
    next(error);
  }
};

export const updateVariantHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const variant = await service.updateVariant(param(req.params.variantId), req.body);
    sendSuccess(res, variant);
  } catch (error) {
    next(error);
  }
};

export const updateStockHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('Unauthenticated');
    }
    const variant = await service.updateStock(
      param(req.params.variantId),
      req.body.quantity,
      req.body.reason,
      req.user.id,
      req.body.notes,
    );
    sendSuccess(res, variant);
  } catch (error) {
    next(error);
  }
};

export const presignedUploadHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await service.getPresignedImageUrl(
      param(req.params.id),
      req.query.filename as string,
      req.query.contentType as string,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const addImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const image = await service.addImage(param(req.params.id), req.body);
    sendSuccess(res, image, 201);
  } catch (error) {
    next(error);
  }
};

export const removeImageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await service.removeImage(param(req.params.imageId));
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};
