import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  changePasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
} from './auth.controller.js';
import { changePasswordSchema, loginSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', authenticate, logoutHandler);
authRouter.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePasswordHandler,
);
