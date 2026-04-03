import { Router } from 'express';
import { logger } from '../utils/logger.js';

export const webhookRouter = Router();

/**
 * POST /api/webhooks/status - Receive delivery status updates from SMS provider
 */
webhookRouter.post('/status', (req, res) => {
  const { messageId, status, timestamp } = req.body;
  logger.info(`Webhook: SMS ${messageId} status updated to ${status}`);

  // Process delivery status update
  // TODO: Update message status in PocketBase

  res.json({ received: true });
});

/**
 * POST /api/webhooks/inbound - Receive inbound SMS messages
 */
webhookRouter.post('/inbound', (req, res) => {
  const { from, to, message } = req.body;
  logger.info(`Webhook: Inbound SMS from ${from}: ${message}`);

  // Process inbound message
  // TODO: Store inbound message in PocketBase, trigger auto-replies

  res.json({ received: true });
});
