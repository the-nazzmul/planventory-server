import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';
import * as repo from './returns.repository.js';

interface CreateReturnInput {
  orderId: string;
  reason: string;
  items: { variantId: string; quantity: number; reason: string }[];
  restocked: boolean;
  refundAmount: number;
}

export const getAll = async (filters: Parameters<typeof repo.findAll>[0]) => {
  const { items, total } = await repo.findAll(filters);
  return buildPaginationMeta(items, filters.limit, total);
};

export const getById = async (id: string) => {
  const returnRecord = await repo.findById(id);
  if (!returnRecord) {
    throw new AppError(404, 'RETURN_NOT_FOUND', 'Return not found');
  }
  return returnRecord;
};

export const processReturn = async (data: CreateReturnInput, processedBy: string) => {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }

  if (order.status !== 'DELIVERED') {
    throw new AppError(400, 'INVALID_ORDER_STATUS', 'Returns can only be processed for DELIVERED orders');
  }

  return prisma.$transaction(async (tx) => {
    const returnRecord = await tx.return.create({
      data: {
        orderId: data.orderId,
        reason: data.reason,
        items: data.items as unknown as Prisma.InputJsonValue,
        refundAmount: data.refundAmount,
        restocked: data.restocked,
        processedBy,
      },
    });

    if (data.restocked) {
      for (const item of data.items) {
        await tx.$executeRaw`UPDATE "ProductVariant" SET stock = stock + ${item.quantity} WHERE id = ${item.variantId}`;

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            reason: 'RETURN',
            referenceId: returnRecord.id,
            notes: `Return for order ${data.orderId}: ${item.reason}`,
            performedBy: processedBy,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: data.orderId },
      data: { status: 'REFUNDED' },
    });

    return returnRecord;
  });
};
