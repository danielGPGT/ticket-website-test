-- Add image column to events table
-- This column stores the path to the image in Supabase Storage
-- Format: "events/{event_id}.webp" or full URL if external
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Create index for image column (useful for queries filtering by image presence)
CREATE INDEX IF NOT EXISTS idx_events_image ON events(image) WHERE image IS NOT NULL;

-- Comment on column
COMMENT ON COLUMN events.image IS 'Path to event image in Supabase Storage (e.g., "events/{event_id}.webp") or full URL for external images';

