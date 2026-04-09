import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import {
  changePasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
} from './auth.controller.js';
import { changePasswordSchema, loginSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', authLimiter, validate(loginSchema), loginHandler);
authRouter.post('/refresh', authLimiter, refreshHandler);
authRouter.post('/logout', authenticate, authLimiter, logoutHandler);
authRouter.patch(
  '/change-password',
  authenticate,
  authLimiter,
  validate(changePasswordSchema),
  changePasswordHandler,
);
