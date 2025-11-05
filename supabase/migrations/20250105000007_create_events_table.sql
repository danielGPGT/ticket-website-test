-- Create events table matching XS2 API structure
CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    event_name TEXT,
    date_start TIMESTAMP WITH TIME ZONE,
    date_stop TIMESTAMP WITH TIME ZONE,
    event_status TEXT,
    tournament_id TEXT,
    tournament_name TEXT,
    venue_id TEXT,
    venue_name TEXT,
    location_id TEXT,
    city TEXT,
    iso_country TEXT,
    latitude TEXT,
    longitude TEXT,
    sport_type TEXT,
    season TEXT,
    tournament_type TEXT,
    date_confirmed BOOLEAN,
    date_start_main_event TIMESTAMP WITH TIME ZONE,
    date_stop_main_event TIMESTAMP WITH TIME ZONE,
    hometeam_id TEXT,
    hometeam_name TEXT,
    visiting_id TEXT,
    visiting_name TEXT,
    created TIMESTAMP WITH TIME ZONE,
    updated TIMESTAMP WITH TIME ZONE,
    event_description TEXT,
    min_ticket_price_eur NUMERIC(10, 2),
    max_ticket_price_eur NUMERIC(10, 2),
    slug TEXT,
    number_of_tickets INTEGER,
    sales_periods JSONB,
    is_popular BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_tournament_id ON events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_sport_type ON events(sport_type);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_iso_country ON events(iso_country);
CREATE INDEX IF NOT EXISTS idx_events_date_start ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_date_stop ON events(date_stop);
CREATE INDEX IF NOT EXISTS idx_events_event_status ON events(event_status);
CREATE INDEX IF NOT EXISTS idx_events_is_popular ON events(is_popular);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_hometeam_id ON events(hometeam_id);
CREATE INDEX IF NOT EXISTS idx_events_visiting_id ON events(visiting_id);

-- JSONB index for sales_periods queries
CREATE INDEX IF NOT EXISTS idx_events_sales_periods ON events USING GIN (sales_periods);

-- Add updated_at trigger
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

