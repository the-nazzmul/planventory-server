import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendError } from '../shared/utils/response.js';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

const normalizePem = (value: string): string => value.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, normalizePem(env.JWT_PUBLIC_KEY), {
      algorithms: ['RS256'],
    }) as JwtPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired access token');
  }
};
