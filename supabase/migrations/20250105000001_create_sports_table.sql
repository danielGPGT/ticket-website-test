-- Create sports table matching XS2 API structure
CREATE TABLE IF NOT EXISTS sports (
    sport_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sports_sport_id ON sports(sport_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sports_updated_at
    BEFORE UPDATE ON sports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

