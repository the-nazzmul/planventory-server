import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
    address: z.record(z.string(), z.unknown()).nullish(),
    contactPerson: z.string().nullish(),
    paymentTerms: z.string().nullish(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().nullish(),
    phone: z.string().nullish(),
    address: z.record(z.string(), z.unknown()).nullish(),
    contactPerson: z.string().nullish(),
    paymentTerms: z.string().nullish(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});
