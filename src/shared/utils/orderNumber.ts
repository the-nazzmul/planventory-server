import { customAlphabet } from 'nanoid';
import { format } from 'date-fns';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export const generateOrderNumber = (): string => {
  const datePart = format(new Date(), 'yyyyMMdd');
  return `ORD-${datePart}-${nanoid()}`;
};
