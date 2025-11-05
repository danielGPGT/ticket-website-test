-- Add image column to sports table
-- This column stores the path to the image in Supabase Storage
-- Format: "sports/{sport_id}.webp" or full URL if external
ALTER TABLE sports 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Create index for image column (useful for queries filtering by image presence)
CREATE INDEX IF NOT EXISTS idx_sports_image ON sports(image) WHERE image IS NOT NULL;

-- Comment on column
COMMENT ON COLUMN sports.image IS 'Path to sport image in Supabase Storage (e.g., "sports/{sport_id}.webp") or full URL for external images';

