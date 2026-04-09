import { z } from 'zod';

const variantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().nullish(),
  color: z.string().nullish(),
  colorHex: z.string().nullish(),
  costPrice: z.number().int(),
  sellingPrice: z.number().int(),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().default(10),
  barcode: z.string().nullish(),
  weight: z.number().nullish(),
  dimensions: z.record(z.string(), z.unknown()).nullish(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().nullish(),
    brandId: z.string().min(1),
    categoryId: z.string().min(1),
    tags: z.array(z.string()).optional(),
    variants: z.array(variantSchema).min(1),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().nullish(),
    brandId: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});

export const getProductsQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const createVariantSchema = z.object({
  body: variantSchema,
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});

export const updateVariantSchema = z.object({
  body: z.object({
    size: z.string().nullish(),
    color: z.string().nullish(),
    colorHex: z.string().nullish(),
    costPrice: z.number().int().optional(),
    sellingPrice: z.number().int().optional(),
    lowStockAlert: z.number().int().optional(),
    barcode: z.string().nullish(),
    weight: z.number().nullish(),
    dimensions: z.record(z.string(), z.unknown()).nullish(),
  }).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string(), variantId: z.string() }),
});

export const updateStockSchema = z.object({
  body: z.object({
    quantity: z.number().int(),
    reason: z.enum(['ADJUSTMENT', 'DAMAGE', 'INITIAL']),
    notes: z.string().optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string(), variantId: z.string() }),
});

export const presignedUploadQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
  query: z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
  }),
});

export const addImageSchema = z.object({
  body: z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    position: z.number().int().optional(),
    isPrimary: z.boolean().optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string() }),
});
