import { z } from 'zod';

export const updateSettingSchema = z.object({
  body: z.object({
    key: z.string().min(1),
    value: z.unknown(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
