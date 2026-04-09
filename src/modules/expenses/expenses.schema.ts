import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    amount: z.number().int(),
    category: z.enum(['OPERATIONAL', 'INVENTORY', 'MARKETING', 'PAYROLL', 'UTILITIES', 'OTHER']),
    description: z.string().min(1),
    reference: z.string().nullish(),
    date: z.coerce.date(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const getExpensesQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    category: z.enum(['OPERATIONAL', 'INVENTORY', 'MARKETING', 'PAYROLL', 'UTILITIES', 'OTHER']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
