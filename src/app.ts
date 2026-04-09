import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { standardLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRouter } from './routes/index.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);
  app.use(standardLimiter);

  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
};
