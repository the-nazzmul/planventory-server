import { Router } from 'express';
import { livenessHandler, readinessHandler } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', livenessHandler);
healthRouter.get('/ready', readinessHandler);
