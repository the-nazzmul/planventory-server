import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis.js';

type RedisClient = typeof redis;

class UpstashRateLimitStore {
  prefix: string;
  client: RedisClient;

  constructor(prefix: string, client: RedisClient) {
    this.prefix = prefix;
    this.client = client;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;
    const totalHits = await this.client.incr(redisKey);

    if (totalHits === 1) {
      await this.client.expire(redisKey, 15 * 60);
    }

    const ttl = await this.client.ttl(redisKey);
    const resetTime = new Date(Date.now() + (ttl > 0 ? ttl : 15 * 60) * 1000);

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
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
  store: new UpstashRateLimitStore('rl:standard:', redis),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse,
  store: new UpstashRateLimitStore('rl:auth:', redis),
});
