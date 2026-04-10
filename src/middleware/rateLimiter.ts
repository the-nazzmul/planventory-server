import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis.js';

type RedisClient = typeof redis;

class UpstashRateLimitStore {
  prefix: string;
  client: RedisClient;
  windowSeconds: number;

  constructor(prefix: string, client: RedisClient, windowSeconds: number) {
    this.prefix = prefix;
    this.client = client;
    this.windowSeconds = windowSeconds;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;
    const totalHits = await this.client.incr(redisKey);

    if (totalHits === 1) {
      await this.client.expire(redisKey, this.windowSeconds);
    }
    const resetTime = new Date(Date.now() + this.windowSeconds * 1000);

    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await this.client.decr(redisKey);
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await this.client.del(redisKey);
  }
}

const errorResponse = {
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
  },
};

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
  store: new UpstashRateLimitStore('rl:standard:', redis, 15 * 60),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
  store: new UpstashRateLimitStore('rl:auth:', redis, 15 * 60),
});

export const financeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
  store: new UpstashRateLimitStore('rl:finance:', redis, 15 * 60),
});
