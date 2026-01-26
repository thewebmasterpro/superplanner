-- Add Pomodoro durations to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS pomodoro_work_duration INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS pomodoro_break_duration INTEGER DEFAULT 5;
