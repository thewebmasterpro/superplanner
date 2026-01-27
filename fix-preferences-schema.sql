-- Add missing columns to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS "campaignSetupDaysBefore" INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS "campaignReportingDaysAfter" INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS "enableCampaigns" BOOLEAN DEFAULT true;
