import { z } from 'zod';

export const createWebhookSchema = z.object({
  body: z.object({
    url: z.string().url(),
    events: z.array(z.enum(['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'STOCK_LOW', 'PRODUCT_UPDATED'])).min(1),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
