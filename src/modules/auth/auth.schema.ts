import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z
      .string()
      .min(12)
      .max(128)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
