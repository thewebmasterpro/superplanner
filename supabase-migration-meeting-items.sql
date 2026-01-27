-- Meeting Items (Agenda) Migration
-- Execute in Supabase SQL Editor

-- 1. Create meeting_items table (junction table for meeting agenda)
CREATE TABLE IF NOT EXISTS meeting_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'campaign')),
  item_id UUID NOT NULL,  -- References tasks.id OR campaigns.id based on item_type
  position INT DEFAULT 0,
  notes TEXT,  -- Optional notes for this agenda item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(meeting_id, item_id)  -- No duplicates in same meeting
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_items_meeting ON meeting_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_items_type ON meeting_items(item_type);

-- 3. RLS Policies
ALTER TABLE meeting_items ENABLE ROW LEVEL SECURITY;

-- Users can manage items for their own meetings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'meeting_items' AND policyname = 'Users can manage their meeting items'
    ) THEN
        CREATE POLICY "Users can manage their meeting items" ON meeting_items
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM meetings m 
                WHERE m.id = meeting_items.meeting_id 
                AND m.user_id = auth.uid()
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM meetings m 
                WHERE m.id = meeting_items.meeting_id 
                AND m.user_id = auth.uid()
            )
        );
    END IF;
END $$;
