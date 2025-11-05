-- Create tournaments table matching XS2 API structure
CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id TEXT PRIMARY KEY,
    official_name TEXT,
    season TEXT,
    tournament_type TEXT,
    region TEXT,
    sport_type TEXT,
    date_start TIMESTAMP WITH TIME ZONE,
    date_stop TIMESTAMP WITH TIME ZONE,
    slug TEXT,
    number_events INTEGER,
    created TIMESTAMP WITH TIME ZONE,
    updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournaments_tournament_id ON tournaments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport_type ON tournaments(sport_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_region ON tournaments(region);
CREATE INDEX IF NOT EXISTS idx_tournaments_tournament_type ON tournaments(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournaments_date_start ON tournaments(date_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_date_stop ON tournaments(date_stop);

-- Add updated_at trigger
CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

