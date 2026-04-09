import { Router } from 'express';
import { healthCheckHandler } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', healthCheckHandler);
