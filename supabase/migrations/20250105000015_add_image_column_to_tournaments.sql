-- Add image column to tournaments table
-- This column stores the path to the image in Supabase Storage
-- Format: "tournaments/{tournament_id}.webp" or full URL if external
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Create index for image column (useful for queries filtering by image presence)
CREATE INDEX IF NOT EXISTS idx_tournaments_image ON tournaments(image) WHERE image IS NOT NULL;

-- Comment on column
COMMENT ON COLUMN tournaments.image IS 'Path to tournament image in Supabase Storage (e.g., "tournaments/{tournament_id}.webp") or full URL for external images';

