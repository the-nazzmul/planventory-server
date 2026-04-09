import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../shared/utils/response.js';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 403, 'FORBIDDEN', 'You do not have permission to access this resource');
      return;
    }

    next();
  };
};
