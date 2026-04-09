import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../shared/errors/AppError.js';
import * as repo from './purchase-orders.repository.js';

export const getAll = () => repo.findAll();

export const getById = async (id: string) => {
  const po = await repo.findById(id);
  if (!po) {
    throw new AppError(404, 'PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found');
  }
  return po;
};

export const create = async (data: {
  supplierId: string;
  notes?: string | null;
  items: { variantId: string; quantity: number; unitCost: number }[];
}) => {
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return repo.create({
    supplierId: data.supplierId,
    notes: data.notes ?? null,
    totalAmount,
    status: 'DRAFT',
    items: data.items,
  });
};

export const update = async (id: string, data: { status?: string; notes?: string | null }) => {
  const po = await getById(id);

  if (data.status === 'ORDERED' && po.status !== 'DRAFT') {
    throw new AppError(400, 'INVALID_STATUS_TRANSITION', 'Can only order from DRAFT status');
  }

  const updateData: Prisma.PurchaseOrderUpdateInput = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status === 'ORDERED') updateData.orderedAt = new Date();

  return repo.update(id, updateData);
};

export const receivePurchaseOrder = async (
  id: string,
  items: { variantId: string; receivedQty: number }[],
  performedBy: string,
) => {
  const po = await getById(id);

  if (po.status !== 'ORDERED' && po.status !== 'PARTIALLY_RECEIVED') {
    throw new AppError(400, 'INVALID_STATUS', 'Purchase order must be ORDERED or PARTIALLY_RECEIVED to receive');
  }

  for (const receiveItem of items) {
    const poItem = po.items.find((i) => i.variantId === receiveItem.variantId);
    if (!poItem) {
      throw new AppError(400, 'INVALID_VARIANT', `Variant ${receiveItem.variantId} not in this purchase order`);
    }
    const remaining = poItem.quantity - poItem.receivedQty;
    if (receiveItem.receivedQty > remaining) {
      throw new AppError(
        400,
        'EXCEEDS_ORDERED_QTY',
        `Cannot receive ${receiveItem.receivedQty} for variant ${receiveItem.variantId}. Only ${remaining} remaining`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    for (const receiveItem of items) {
      await tx.$executeRaw`UPDATE "ProductVariant" SET stock = stock + ${receiveItem.receivedQty} WHERE id = ${receiveItem.variantId}`;

      await tx.purchaseOrderItem.updateMany({
        where: { purchaseOrderId: id, variantId: receiveItem.variantId },
        data: { receivedQty: { increment: receiveItem.receivedQty } },
      });

      await tx.stockMovement.create({
        data: {
          variantId: receiveItem.variantId,
          quantity: receiveItem.receivedQty,
          reason: 'RESTOCK',
          referenceId: id,
          performedBy,
          notes: `Purchase order ${id} receive`,
        },
      });
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    const allFullyReceived = updatedItems.every((item) => item.receivedQty >= item.quantity);
    const newStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    const updated = await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        ...(allFullyReceived ? { receivedAt: new Date() } : {}),
      },
      include: {
        supplier: true,
        items: { include: { variant: true } },
      },
    });

    return updated;
  });
};
