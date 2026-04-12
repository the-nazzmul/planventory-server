import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { changePassword, login, logout, refresh } from './auth.service.js';

const cookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    path: '/',
    // Cross-site SPA -> API requests require SameSite=None, which also requires Secure=true.
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await login(req.body.email, req.body.password, req.ip, req.get('user-agent'));

    res.cookie('refreshToken', result.refreshToken, cookieOptions());
    sendSuccess(
      res,
      {
        accessToken: result.accessToken,
        user: result.user,
      },
      200,
    );
  } catch (error) {
    next(error);
  }
};

export const refreshHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken as string | undefined;

    if (!rawToken) {
      throw new AppError(401, 'MISSING_REFRESH_TOKEN', 'Refresh token cookie missing');
    }

    const result = await refresh(rawToken, req.ip, req.get('user-agent'));

    res.cookie('refreshToken', result.refreshToken, cookieOptions());
    sendSuccess(res, { accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
};

export const logoutHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken as string | undefined;

    if (!rawToken || !req.user) {
      throw new AppError(401, 'MISSING_REFRESH_TOKEN', 'Refresh token cookie missing');
    }

    await logout(rawToken, req.user.id, req.ip, req.get('user-agent'));

    res.clearCookie('refreshToken', cookieOptions());
    sendSuccess(res, { loggedOut: true });
  } catch (error) {
    next(error);
  }
};

export const changePasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
    }

    await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword, req.ip, req.get('user-agent'));

    sendSuccess(res, { changed: true });
  } catch (error) {
    next(error);
  }
};
