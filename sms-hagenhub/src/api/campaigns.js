import { Router } from 'express';
import { campaignService } from '../services/campaignService.js';

export const campaignRouter = Router();

/**
 * POST /api/campaigns - Create a new campaign
 * Body: { name: "Promo", message: "Hello!", recipients: ["+49..."] }
 */
campaignRouter.post('/', async (req, res) => {
  try {
    const { name, message, recipients } = req.body;
    if (!name || !message || !recipients?.length) {
      return res.status(400).json({ error: 'Missing required fields: name, message, recipients' });
    }
    const campaign = campaignService.create(name, message, recipients);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/campaigns - List all campaigns
 */
campaignRouter.get('/', (req, res) => {
  res.json(campaignService.list());
});

/**
 * GET /api/campaigns/:id - Get campaign details
 */
campaignRouter.get('/:id', (req, res) => {
  const campaign = campaignService.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

/**
 * POST /api/campaigns/:id/execute - Execute (send) a campaign
 */
campaignRouter.post('/:id/execute', async (req, res) => {
  try {
    const result = await campaignService.execute(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
