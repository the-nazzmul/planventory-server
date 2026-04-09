import { prisma } from '../../config/prisma.js';

export const aggregateDeliveredRevenue = (where?: { gte?: Date; lte?: Date }) => {
  return prisma.order.aggregate({
    where: {
      status: 'DELIVERED',
      ...(where ? { createdAt: where } : {}),
    },
    _sum: { totalAmount: true },
  });
};

export const aggregateCogs = () => {
  return prisma.$queryRaw<{ cogs: bigint | null }[]>`
    SELECT COALESCE(SUM(oi.quantity * pv."costPrice"), 0) AS cogs
    FROM "OrderItem" oi
    JOIN "ProductVariant" pv ON oi."variantId" = pv.id
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o.status = 'DELIVERED'
  `;
};

export const aggregateExpenses = () => {
  return prisma.expense.aggregate({ _sum: { amount: true } });
};

export const groupExpensesByCategory = () => {
  return prisma.expense.groupBy({
    by: ['category'],
    _sum: { amount: true },
  });
};

export const groupOrdersByStatus = () => {
  return prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });
};

export const revenueByMonth = (year: number) => {
  return prisma.$queryRaw<{ month: string; revenue: bigint }[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
           COALESCE(SUM("totalAmount"), 0) AS revenue
    FROM "Order"
    WHERE status = 'DELIVERED'
      AND EXTRACT(YEAR FROM "createdAt") = ${year}
    GROUP BY month
    ORDER BY month
  `;
};

export const expensesByMonth = (year: number) => {
  return prisma.$queryRaw<{ month: string; expenses: bigint }[]>`
    SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month,
           COALESCE(SUM(amount), 0) AS expenses
    FROM "Expense"
    WHERE EXTRACT(YEAR FROM date) = ${year}
    GROUP BY month
    ORDER BY month
  `;
};
