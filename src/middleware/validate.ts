import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
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

    const validated = result.data as {
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
    };

    if (validated.body !== undefined) req.body = validated.body;
    if (validated.query !== undefined) Object.assign(req.query, validated.query);
    if (validated.params !== undefined) Object.assign(req.params, validated.params as Record<string, string>);

    next();
  };
};
