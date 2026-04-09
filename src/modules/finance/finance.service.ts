import * as repo from './finance.repository.js';

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
    repo.aggregateDeliveredRevenue(),
    repo.aggregateDeliveredRevenue({ gte: thisMonthStart }),
    repo.aggregateDeliveredRevenue({ gte: lastMonthStart, lte: lastMonthEnd }),
    repo.aggregateCogs(),
    repo.aggregateExpenses(),
    repo.groupExpensesByCategory(),
    repo.groupOrdersByStatus(),
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
  const [revenueData, expensesData] = await Promise.all([
    repo.revenueByMonth(year),
    repo.expensesByMonth(year),
  ]);

  const months = new Map<string, { revenue: number; expenses: number }>();

  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    months.set(key, { revenue: 0, expenses: 0 });
  }

  for (const row of revenueData) {
    const entry = months.get(row.month);
    if (entry) entry.revenue = Number(row.revenue);
  }

  for (const row of expensesData) {
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
