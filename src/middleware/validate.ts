import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { sendError } from '../shared/utils/response.js';

/**
 * Express 5 exposes `req.params` / `req.query` in a way that breaks if we replace
 * them with `Object.defineProperty` — the router then throws
 * "Cannot set property params of #<IncomingMessage> which has only a getter".
 * Merge validated values into the existing objects instead.
 */
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

    if (validated.query !== undefined) {
      const q = validated.query as Record<string, unknown>;
      const target = req.query as Record<string, unknown>;
      for (const key of Object.keys(target)) {
        if (!(key in q)) delete target[key];
      }
      Object.assign(target, q);
    }

    if (validated.params !== undefined) {
      const p = validated.params as Record<string, string>;
      const target = req.params as Record<string, string>;
      for (const key of Object.keys(target)) {
        if (!(key in p)) delete target[key];
      }
      Object.assign(target, p);
    }

    next();
  };
};
