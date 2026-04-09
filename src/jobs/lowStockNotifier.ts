import { prisma } from '../config/prisma.js';
import logger from '../shared/utils/logger.js';
import { dispatchWebhook } from './webhookDispatcher.js';

export const checkLowStock = async (): Promise<void> => {
  try {
    const thresholdSetting = await prisma.setting.findUnique({
      where: { key: 'low_stock_threshold' },
    });

    const threshold = thresholdSetting
      ? (typeof thresholdSetting.value === 'number' ? thresholdSetting.value : 10)
      : 10;

    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: prisma.productVariant.fields.lowStockAlert as never },
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

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
        threshold,
        variants: lowStockVariants.map((v) => ({
          id: v.id,
          sku: v.sku,
          productName: v.product.name,
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
