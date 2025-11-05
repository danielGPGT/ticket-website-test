-- Create categories table matching XS2 API structure
CREATE TABLE IF NOT EXISTS categories (
    category_id TEXT PRIMARY KEY,
    category_name TEXT,
    venue_id TEXT,
    sport_type TEXT,
    venue_name TEXT,
    created TIMESTAMP WITH TIME ZONE,
    on_svg BOOLEAN,
    description JSONB,
    options JSONB,
    category_type TEXT,
    ticket_delivery_days INTEGER,
    party_size_together INTEGER,
    distribution_channel TEXT,
    highlight_type TEXT,
    files JSONB,
    sports_enabled TEXT[],
    sports_disabled TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_category_id ON categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_venue_id ON categories(venue_id);
CREATE INDEX IF NOT EXISTS idx_categories_sport_type ON categories(sport_type);
CREATE INDEX IF NOT EXISTS idx_categories_category_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_highlight_type ON categories(highlight_type);
CREATE INDEX IF NOT EXISTS idx_categories_distribution_channel ON categories(distribution_channel);

-- JSONB indexes for nested queries
CREATE INDEX IF NOT EXISTS idx_categories_description ON categories USING GIN (description);
CREATE INDEX IF NOT EXISTS idx_categories_options ON categories USING GIN (options);
CREATE INDEX IF NOT EXISTS idx_categories_files ON categories USING GIN (files);

-- Array indexes
CREATE INDEX IF NOT EXISTS idx_categories_sports_enabled ON categories USING GIN (sports_enabled);
CREATE INDEX IF NOT EXISTS idx_categories_sports_disabled ON categories USING GIN (sports_disabled);

-- Add updated_at trigger
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

