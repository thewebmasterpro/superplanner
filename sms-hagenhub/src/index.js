import express from 'express';
import dotenv from 'dotenv';
import { smsRouter } from './api/sms.js';
import { campaignRouter } from './api/campaigns.js';
import { webhookRouter } from './api/webhooks.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sms-hagenhub', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/sms', smsRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/webhooks', webhookRouter);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`SMS-HagenHub service running on port ${PORT}`);
});

export default app;
