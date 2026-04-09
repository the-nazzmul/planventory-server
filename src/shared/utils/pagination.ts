export interface PaginationParams {
  cursor?: string | undefined;
  limit: number;
}

export interface PaginationMeta {
  cursor: string | null;
  hasMore: boolean;
  total: number;
  [key: string]: unknown;
}

export const buildPaginationMeta = <T extends { id: string }>(
  items: T[],
  limit: number,
  total: number,
): { data: T[]; meta: PaginationMeta } => {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const cursor = data.length > 0 ? data[data.length - 1]!.id : null;

  return {
    data,
    meta: { cursor, hasMore, total },
  };
};
