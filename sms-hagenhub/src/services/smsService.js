import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { isValidPhoneNumber, isValidMessage, sanitizePhoneNumber } from '../utils/validators.js';

export class SmsService {
  constructor() {
    this.provider = config.sms.provider;
    this.sentCount = { minute: 0, day: 0, lastMinuteReset: Date.now(), lastDayReset: Date.now() };
  }

  /**
   * Send a single SMS
   */
  async send(to, message) {
    const phone = sanitizePhoneNumber(to);

    if (!isValidPhoneNumber(phone)) {
      throw new Error(`Invalid phone number: ${to}`);
    }
    if (!isValidMessage(message)) {
      throw new Error('Invalid message: must be 1-1600 characters');
    }

    this.checkRateLimit();

    logger.info(`Sending SMS to ${phone} via ${this.provider}`);

    const result = await this.dispatchToProvider(phone, message);

    this.sentCount.minute++;
    this.sentCount.day++;

    return {
      id: result.id,
      to: phone,
      status: 'sent',
      provider: this.provider,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send bulk SMS to multiple recipients
   */
  async sendBulk(recipients, message) {
    if (!isValidMessage(message)) {
      throw new Error('Invalid message: must be 1-1600 characters');
    }

    const results = [];
    for (const to of recipients) {
      try {
        const result = await this.send(to, message);
        results.push(result);
      } catch (err) {
        results.push({ to, status: 'failed', error: err.message });
      }
    }

    return results;
  }

  /**
   * Dispatch SMS to the configured provider
   */
  async dispatchToProvider(to, message) {
    // Provider integration point
    // Replace with actual provider SDK calls (Twilio, Vonage, etc.)
    logger.debug(`[${this.provider}] Dispatching SMS to ${to}`);

    // Placeholder - integrate actual provider here
    return {
      id: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'queued',
    };
  }

  checkRateLimit() {
    const now = Date.now();

    if (now - this.sentCount.lastMinuteReset > 60_000) {
      this.sentCount.minute = 0;
      this.sentCount.lastMinuteReset = now;
    }
    if (now - this.sentCount.lastDayReset > 86_400_000) {
      this.sentCount.day = 0;
      this.sentCount.lastDayReset = now;
    }

    if (this.sentCount.minute >= config.rateLimit.perMinute) {
      throw new Error('Rate limit exceeded: too many SMS per minute');
    }
    if (this.sentCount.day >= config.rateLimit.perDay) {
      throw new Error('Rate limit exceeded: daily SMS limit reached');
    }
  }
}

export const smsService = new SmsService();
