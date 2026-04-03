import { Router } from 'express';
import { smsService } from '../services/smsService.js';

export const smsRouter = Router();

/**
 * POST /api/sms/send - Send a single SMS
 * Body: { to: "+491234567890", message: "Hello!" }
 */
smsRouter.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }
    const result = await smsService.send(to, message);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/sms/send-bulk - Send SMS to multiple recipients
 * Body: { recipients: ["+49...", "+49..."], message: "Hello!" }
 */
smsRouter.post('/send-bulk', async (req, res) => {
  try {
    const { recipients, message } = req.body;
    if (!recipients?.length || !message) {
      return res.status(400).json({ error: 'Missing required fields: recipients, message' });
    }
    const results = await smsService.sendBulk(recipients, message);
    res.json({ total: results.length, results });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
