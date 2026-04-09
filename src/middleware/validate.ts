import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { sendError } from '../shared/utils/response.js';

export const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body ?? {},
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      sendError(res, 422, 'VALIDATION_ERROR', 'Validation failed', result.error.flatten());
      return;
    }

    const validated = result.data as { body?: unknown };
    req.body = validated.body;
    next();
  };
};
