import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    parentId: z.string().nullish(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    parentId: z.string().nullish(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});
