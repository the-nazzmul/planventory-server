import { z } from 'zod';

export const getStockMovementsQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    variantId: z.string().optional(),
    productId: z.string().optional(),
    search: z.string().optional(),
    reason: z.enum(['SALE', 'RESTOCK', 'RETURN', 'DAMAGE', 'ADJUSTMENT', 'INITIAL']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
