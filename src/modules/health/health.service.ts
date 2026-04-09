import * as repo from './health.repository.js';

export const checkHealth = async () => {
  const [dbOk, redisOk] = await Promise.all([repo.pingDatabase(), repo.pingRedis()]);

  return {
    healthy: dbOk && redisOk,
    db: dbOk ? 'ok' : 'unavailable',
    redis: redisOk ? 'ok' : 'unavailable',
  };
};
