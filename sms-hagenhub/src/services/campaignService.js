import { smsService } from './smsService.js';
import { logger } from '../utils/logger.js';

export class CampaignService {
  constructor() {
    this.campaigns = new Map();
  }

  /**
   * Create a new SMS campaign
   */
  create(name, message, recipients) {
    const id = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const campaign = {
      id,
      name,
      message,
      recipients,
      status: 'draft',
      createdAt: new Date().toISOString(),
      results: [],
    };
    this.campaigns.set(id, campaign);
    logger.info(`Campaign created: ${id} - ${name}`);
    return campaign;
  }

  /**
   * Execute a campaign (send SMS to all recipients)
   */
  async execute(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);
    if (campaign.status === 'sent') throw new Error('Campaign already sent');

    campaign.status = 'sending';
    logger.info(`Executing campaign: ${campaignId}`);

    campaign.results = await smsService.sendBulk(campaign.recipients, campaign.message);
    campaign.status = 'sent';
    campaign.sentAt = new Date().toISOString();

    const sent = campaign.results.filter(r => r.status === 'sent').length;
    const failed = campaign.results.filter(r => r.status === 'failed').length;
    logger.info(`Campaign ${campaignId} complete: ${sent} sent, ${failed} failed`);

    return campaign;
  }

  get(campaignId) {
    return this.campaigns.get(campaignId) || null;
  }

  list() {
    return Array.from(this.campaigns.values());
  }
}

export const campaignService = new CampaignService();
