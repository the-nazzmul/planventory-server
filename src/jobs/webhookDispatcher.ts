import { createHmac } from 'node:crypto';
import logger from '../shared/utils/logger.js';

const RETRY_DELAYS = [1000, 2000, 4000];

export const dispatchWebhook = async (
  url: string,
  secret: string,
  event: string,
  payload: unknown,
): Promise<void> => {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        logger.info(`Webhook delivered: ${event} to ${url}`);
        return;
      }

      logger.warn(`Webhook attempt ${attempt + 1} failed: ${response.status} for ${url}`);
    } catch (error) {
      logger.warn(`Webhook attempt ${attempt + 1} error for ${url}`, { error });
    }

    const delay = RETRY_DELAYS[attempt];
    if (delay !== undefined) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error(`Webhook delivery permanently failed: ${event} to ${url}`);
};
