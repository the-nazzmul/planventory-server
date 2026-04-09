import { z } from 'zod';

export const getReportsQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    period: z.enum(['monthly']).default('monthly'),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});
