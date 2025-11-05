-- Create venues table matching XS2 API structure
CREATE TABLE IF NOT EXISTS venues (
    venue_id TEXT PRIMARY KEY,
    official_name TEXT,
    country TEXT,
    popular_stadium BOOLEAN,
    venue_type TEXT,
    capacity INTEGER,
    city TEXT,
    province TEXT,
    latitude TEXT,
    longitude TEXT,
    number TEXT,
    postalcode TEXT,
    streetname TEXT,
    opened INTEGER,
    track_length INTEGER,
    wikipedia_slug TEXT,
    wikipedia_snippet TEXT,
    slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_venues_venue_id ON venues(venue_id);
CREATE INDEX IF NOT EXISTS idx_venues_country ON venues(country);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_popular_stadium ON venues(popular_stadium);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);

-- Add updated_at trigger
CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

