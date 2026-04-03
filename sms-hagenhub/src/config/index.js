import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  pocketbase: {
    url: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    fromNumber: process.env.SMS_FROM_NUMBER,
  },

  rateLimit: {
    perMinute: parseInt(process.env.SMS_RATE_LIMIT_PER_MINUTE || '60', 10),
    perDay: parseInt(process.env.SMS_RATE_LIMIT_PER_DAY || '1000', 10),
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
