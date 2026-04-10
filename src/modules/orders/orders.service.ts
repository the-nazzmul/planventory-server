import type { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { invalidateCacheNamespace, withCache } from '../../lib/cache.js';
import { generateOrderNumber } from '../../shared/utils/orderNumber.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import { validateTransition } from './orderStateMachine.js';
import * as repo from './orders.repository.js';

interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string };
  items: { variantId: string; quantity: number }[];
  notes?: string | null;
  idempotencyKey: string;
  taxAmount?: number;
  discountAmount?: number;
  shippingCost?: number;
}

export const getAll = async (filters: Parameters<typeof repo.findAll>[0]) => {
  return withCache('orders:list', 45, [filters], async () => {
    const { items, total } = await repo.findAll(filters);
    return buildPaginationMeta(items, filters.limit, total);
  });
};

export const getById = async (id: string) => {
  const order = await repo.findById(id);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  return order;
};

export const getItems = (orderId: string) => {
  return repo.findItemsByOrderId(orderId);
};

export const create = async (data: CreateOrderInput, processedBy?: string): Promise<{ order: NonNullable<Awaited<ReturnType<typeof repo.findByIdempotencyKey>>>; isExisting: boolean }> => {
  const existing = await repo.findByIdempotencyKey(data.idempotencyKey);
  if (existing) {
    return { order: existing, isExisting: true };
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
    const variants = await tx.productVariant.findMany({
      where: { id: { in: data.items.map((i) => i.variantId) } },
    });

    let subtotal = 0;
    const orderItems: { variantId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    for (const item of data.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new AppError(404, 'VARIANT_NOT_FOUND', `Variant ${item.variantId} not found`);
      }

      const result: { id: string }[] = await tx.$queryRaw`
        UPDATE "ProductVariant"
        SET stock = stock - ${item.quantity}
        WHERE id = ${item.variantId} AND stock >= ${item.quantity}
        RETURNING id
      `;

      if (result.length === 0) {
        throw new AppError(409, 'INSUFFICIENT_STOCK', `Insufficient stock for variant ${variant.sku}`);
      }

      const unitPrice = variant.sellingPrice;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          quantity: -item.quantity,
          reason: 'SALE',
          referenceId: data.idempotencyKey,
          performedBy: processedBy ?? 'SYSTEM',
        },
      });
    }

    const taxAmount = data.taxAmount ?? 0;
    const discountAmount = data.discountAmount ?? 0;
    const shippingCost = data.shippingCost ?? 0;
    const totalAmount = subtotal + taxAmount - discountAmount + shippingCost;

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        shippingAddress: data.shippingAddress,
        subtotal,
        taxAmount,
        discountAmount,
        shippingCost,
        totalAmount,
        notes: data.notes ?? null,
        idempotencyKey: data.idempotencyKey,
        processedBy: processedBy ?? null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { variant: true } },
      },
    });

    return order;
    });
    await Promise.all([
      invalidateCacheNamespace('orders:list'),
      invalidateCacheNamespace('products:list'),
      invalidateCacheNamespace('stock-movements:list'),
      invalidateCacheNamespace('finance:overview'),
      invalidateCacheNamespace('finance:reports'),
    ]);
    return { order, isExisting: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const raceWinner = await repo.findByIdempotencyKey(data.idempotencyKey);
      if (raceWinner) {
        return { order: raceWinner, isExisting: true };
      }
    }
    throw error;
  }
};

export const updateStatus = async (
  id: string,
  status: OrderStatus,
  trackingNumber?: string,
  processedBy?: string,
) => {
  const order = await getById(id);

  if (status === 'REFUNDED') {
    throw new AppError(400, 'USE_RETURNS_FLOW', 'REFUNDED status can only be set through the returns endpoint');
  }

  validateTransition(order.status, status);

  if (status === 'SHIPPED' && !trackingNumber) {
    throw new AppError(400, 'TRACKING_REQUIRED', 'Tracking number is required when shipping');
  }

  if (status === 'CANCELLED') {
    const cancelled = await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId: id }, include: { variant: true } });

      for (const item of items) {
        await tx.$executeRaw`UPDATE "ProductVariant" SET stock = stock + ${item.quantity} WHERE id = ${item.variantId}`;

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            reason: 'ADJUSTMENT',
            referenceId: id,
            notes: 'Order cancelled — stock released',
            performedBy: processedBy ?? 'SYSTEM',
          },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status, processedBy: processedBy ?? null },
        include: { items: { include: { variant: true } } },
      });
    });
    await Promise.all([
      invalidateCacheNamespace('orders:list'),
      invalidateCacheNamespace('products:list'),
      invalidateCacheNamespace('stock-movements:list'),
      invalidateCacheNamespace('finance:overview'),
      invalidateCacheNamespace('finance:reports'),
    ]);
    return cancelled;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber ? { trackingNumber } : {}),
      processedBy: processedBy ?? null,
    },
    include: { items: { include: { variant: true } } },
  });
  await Promise.all([
    invalidateCacheNamespace('orders:list'),
    invalidateCacheNamespace('finance:overview'),
    invalidateCacheNamespace('finance:reports'),
  ]);
  return updated;
};
