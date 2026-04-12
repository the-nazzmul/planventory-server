import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRouter } from './routes/index.js';

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

export const createApp = (): Express => {
  const app = express();

  const allowedOrigins = env.ALLOWED_ORIGINS.map(normalizeOrigin);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalized = normalizeOrigin(origin);
        const allowed = allowedOrigins.some(
          (o) => o === normalized || o.toLowerCase() === normalized.toLowerCase(),
        );
        callback(null, allowed);
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
      optionsSuccessStatus: 204,
      maxAge: 86_400,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);

  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
};
