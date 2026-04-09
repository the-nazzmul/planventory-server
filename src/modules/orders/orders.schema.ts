import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string().nullish(),
    shippingAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    }),
    items: z.array(z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().min(1),
    })).min(1),
    notes: z.string().nullish(),
    idempotencyKey: z.string().min(1),
    taxAmount: z.number().int().optional(),
    discountAmount: z.number().int().optional(),
    shippingCost: z.number().int().optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    trackingNumber: z.string().optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});

export const getOrdersQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    customerEmail: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
