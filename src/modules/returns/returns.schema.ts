import { z } from 'zod';

export const createReturnSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    reason: z.string().min(1),
    items: z.array(z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().min(1),
      reason: z.string().min(1),
    })).min(1),
    restocked: z.boolean(),
    refundAmount: z.number().int(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const getReturnsQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    orderId: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
