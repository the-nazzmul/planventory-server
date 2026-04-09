import { z } from 'zod';

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().min(1) }),
});

export const twoIdParamSchema = (secondKey: string) =>
  z.object({
    body: z.object({}).optional(),
    query: z.object({}).passthrough(),
    params: z.object({ id: z.string().min(1), [secondKey]: z.string().min(1) }),
  });
