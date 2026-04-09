import winston from 'winston';
import { env } from '../../config/env.js';

const logger =
  env.NODE_ENV === 'production'
    ? winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [new winston.transports.Console()],
      })
    : winston.createLogger({
        level: 'debug',
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        transports: [new winston.transports.Console()],
      });

export default logger;
