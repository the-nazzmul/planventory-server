import { redis } from '../config/redis.js';

const VERSION_PREFIX = 'cache:ver:';

const stringifyPart = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const getVersion = async (namespace: string): Promise<number> => {
  const raw = await redis.get<number | string | null>(`${VERSION_PREFIX}${namespace}`);
  if (raw === null || raw === undefined) return 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const makeKey = (namespace: string, version: number, parts: unknown[]): string => {
  const suffix = parts.map(stringifyPart).join('|');
  return `cache:${namespace}:v${version}:${suffix}`;
};

export const withCache = async <T>(
  namespace: string,
  ttlSeconds: number,
  parts: unknown[],
  loader: () => Promise<T>,
): Promise<T> => {
  try {
    const version = await getVersion(namespace);
    const key = makeKey(namespace, version, parts);
    const cached = await redis.get<string | null>(key);
    if (typeof cached === 'string') {
      return JSON.parse(cached) as T;
    }
    const fresh = await loader();
    await redis.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
    return fresh;
  } catch {
    return loader();
  }
};

export const invalidateCacheNamespace = async (namespace: string): Promise<void> => {
  try {
    await redis.incr(`${VERSION_PREFIX}${namespace}`);
  } catch {
    // best-effort invalidation
  }
};

