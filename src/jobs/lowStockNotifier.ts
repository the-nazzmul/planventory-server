import { prisma } from '../config/prisma.js';
import logger from '../shared/utils/logger.js';
import { dispatchWebhook } from './webhookDispatcher.js';

export const checkLowStock = async (): Promise<void> => {
  try {
    const thresholdSetting = await prisma.setting.findUnique({
      where: { key: 'low_stock_threshold' },
    });

    const globalThreshold = thresholdSetting
      ? (typeof thresholdSetting.value === 'number' ? thresholdSetting.value : 10)
      : 10;

    const lowStockVariants = await prisma.$queryRaw<
      { id: string; sku: string; stock: number; lowStockAlert: number; productName: string }[]
    >`
      SELECT pv.id, pv.sku, pv.stock, pv."lowStockAlert", p.name AS "productName"
      FROM "ProductVariant" pv
      JOIN "Product" p ON pv."productId" = p.id
      WHERE pv.stock <= pv."lowStockAlert"
    `;

    if (lowStockVariants.length === 0) {
      logger.info('Low stock check: no variants below threshold');
      return;
    }

    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true, events: { has: 'STOCK_LOW' } },
    });

    let alertsSent = 0;

    for (const webhook of webhooks) {
      await dispatchWebhook(webhook.url, webhook.secret, 'STOCK_LOW', {
        globalThreshold,
        variants: lowStockVariants.map((v) => ({
          id: v.id,
          sku: v.sku,
          productName: v.productName,
          stock: v.stock,
          lowStockAlert: v.lowStockAlert,
        })),
      });
      alertsSent++;
    }

    logger.info(`Low stock check: ${lowStockVariants.length} variants, ${alertsSent} webhooks notified`);
  } catch (error) {
    logger.error('Low stock notifier failed', { error });
  }
};
