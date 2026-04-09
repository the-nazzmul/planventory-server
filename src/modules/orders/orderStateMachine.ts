import type { OrderStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const validateTransition = (from: OrderStatus, to: OrderStatus): void => {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new AppError(
      400,
      'INVALID_TRANSITION',
      `Cannot transition from ${from} to ${to}`,
    );
  }
};
