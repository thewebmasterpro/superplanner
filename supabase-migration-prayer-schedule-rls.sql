-- Enable RLS on prayer_schedule table
ALTER TABLE prayer_schedule ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read prayer times
CREATE POLICY "Anyone can view prayer schedule"
  ON prayer_schedule FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert prayer times
CREATE POLICY "Authenticated users can insert prayer schedule"
  ON prayer_schedule FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update prayer times
CREATE POLICY "Authenticated users can update prayer schedule"
  ON prayer_schedule FOR UPDATE
  TO authenticated
  USING (true);

-- Note: Prayer schedule is shared across all users (same times for everyone)
