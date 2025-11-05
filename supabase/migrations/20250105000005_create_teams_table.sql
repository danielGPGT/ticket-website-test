-- Create teams table matching XS2 API structure
CREATE TABLE IF NOT EXISTS teams (
    team_id TEXT PRIMARY KEY,
    official_name TEXT,
    popular_team BOOLEAN,
    sport_type TEXT,
    slug TEXT,
    iso_country TEXT,
    wikipedia_slug TEXT,
    wikipedia_snippet TEXT,
    venue_id TEXT,
    team_slug TEXT,
    logo_filename TEXT,
    colors_svg TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport_type ON teams(sport_type);
CREATE INDEX IF NOT EXISTS idx_teams_iso_country ON teams(iso_country);
CREATE INDEX IF NOT EXISTS idx_teams_popular_team ON teams(popular_team);
CREATE INDEX IF NOT EXISTS idx_teams_venue_id ON teams(venue_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- Add updated_at trigger
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

