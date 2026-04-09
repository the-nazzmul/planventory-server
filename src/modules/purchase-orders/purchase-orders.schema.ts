import { z } from 'zod';

const purchaseOrderItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitCost: z.number().int(),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1),
    notes: z.string().nullish(),
    items: z.array(purchaseOrderItemSchema).min(1),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updatePurchaseOrderSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'ORDERED', 'CANCELLED']).optional(),
    notes: z.string().nullish(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});

export const receivePurchaseOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      variantId: z.string().min(1),
      receivedQty: z.number().int().min(1),
    })).min(1),
  }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});
