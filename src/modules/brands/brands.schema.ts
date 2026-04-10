import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    logoUrl: z.string().url().nullish(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    logoUrl: z.string().url().nullish(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});

export const getBrandsQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});
