-- Create cities table matching XS2 API structure
CREATE TABLE IF NOT EXISTS cities (
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (city, country)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_cities_city ON cities(city);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);

-- Add updated_at trigger
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

