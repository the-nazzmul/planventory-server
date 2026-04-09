import { prisma } from '../../config/prisma.js';

interface MonthlyReport {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export const getOverview = async () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    cogsResult,
    expenseTotal,
    expensesByCategory,
    orderCounts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: 'DELIVERED', createdAt: { gte: thisMonthStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: 'DELIVERED', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.$queryRaw<{ cogs: bigint | null }[]>`
      SELECT COALESCE(SUM(oi.quantity * pv."costPrice"), 0) AS cogs
      FROM "OrderItem" oi
      JOIN "ProductVariant" pv ON oi."variantId" = pv.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o.status = 'DELIVERED'
    `,
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const revenue = {
    total: totalRevenue._sum.totalAmount ?? 0,
    thisMonth: thisMonthRevenue._sum.totalAmount ?? 0,
    lastMonth: lastMonthRevenue._sum.totalAmount ?? 0,
  };

  const cogs = Number(cogsResult[0]?.cogs ?? 0);
  const grossProfit = revenue.total - cogs;
  const grossMargin = revenue.total > 0 ? Math.round((grossProfit / revenue.total) * 10000) / 100 : 0;
  const totalExpenses = expenseTotal._sum.amount ?? 0;
  const netProfit = grossProfit - totalExpenses;

  const byCategory = expensesByCategory.map((e) => ({
    category: e.category,
    total: e._sum.amount ?? 0,
  }));

  const orderCountMap = new Map(orderCounts.map((o) => [o.status, o._count]));

  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    expenses: {
      total: totalExpenses,
      byCategory,
    },
    netProfit,
    orders: {
      total: orderCounts.reduce((s, o) => s + o._count, 0),
      pending: orderCountMap.get('PENDING') ?? 0,
      delivered: orderCountMap.get('DELIVERED') ?? 0,
      cancelled: orderCountMap.get('CANCELLED') ?? 0,
    },
  };
};

export const getMonthlyReport = async (year: number): Promise<MonthlyReport[]> => {
  const revenueByMonth = await prisma.$queryRaw<{ month: string; revenue: bigint }[]>`
    SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
           COALESCE(SUM("totalAmount"), 0) AS revenue
    FROM "Order"
    WHERE status = 'DELIVERED'
      AND EXTRACT(YEAR FROM "createdAt") = ${year}
    GROUP BY month
    ORDER BY month
  `;

  const expensesByMonth = await prisma.$queryRaw<{ month: string; expenses: bigint }[]>`
    SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month,
           COALESCE(SUM(amount), 0) AS expenses
    FROM "Expense"
    WHERE EXTRACT(YEAR FROM date) = ${year}
    GROUP BY month
    ORDER BY month
  `;

  const months = new Map<string, { revenue: number; expenses: number }>();

  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    months.set(key, { revenue: 0, expenses: 0 });
  }

  for (const row of revenueByMonth) {
    const entry = months.get(row.month);
    if (entry) entry.revenue = Number(row.revenue);
  }

  for (const row of expensesByMonth) {
    const entry = months.get(row.month);
    if (entry) entry.expenses = Number(row.expenses);
  }

  const result: MonthlyReport[] = [];
  for (const [month, data] of months.entries()) {
    result.push({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
    });
  }

  return result;
};
