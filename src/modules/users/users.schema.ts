import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(12).max(128),
    name: z.string().min(1).max(100),
    role: z.enum(['SUPER_ADMIN', 'MANAGER', 'WAREHOUSE']),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    role: z.enum(['SUPER_ADMIN', 'MANAGER', 'WAREHOUSE']).optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});

export const getUsersQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});
