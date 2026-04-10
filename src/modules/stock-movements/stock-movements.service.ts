import { withCache } from '../../lib/cache.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './stock-movements.repository.js';

export const getAll = async (filters: Parameters<typeof repo.findAll>[0]) => {
  return withCache('stock-movements:list', 45, [filters], async () => {
    const { items, total } = await repo.findAll(filters);
    return buildPaginationMeta(items, filters.limit, total);
  });
};
