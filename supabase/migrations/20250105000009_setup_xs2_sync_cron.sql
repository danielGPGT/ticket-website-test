-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a table to track sync runs (optional, for monitoring)
CREATE TABLE IF NOT EXISTS xs2_sync_logs (
    id SERIAL PRIMARY KEY,
    sync_type TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    inserted_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_xs2_sync_logs_started_at ON xs2_sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_xs2_sync_logs_status ON xs2_sync_logs(status);

-- Function to log sync start
CREATE OR REPLACE FUNCTION log_xs2_sync_start(sync_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO xs2_sync_logs (sync_type, status)
    VALUES (sync_type, 'running')
    RETURNING id INTO log_id;
    RETURN log_id;
END;
$$;

-- Function to log sync completion
CREATE OR REPLACE FUNCTION log_xs2_sync_complete(
    log_id INTEGER,
    inserted_count INTEGER,
    updated_count INTEGER,
    error_count INTEGER,
    error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    duration_ms INTEGER;
BEGIN
    SELECT EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000 INTO duration_ms
    FROM xs2_sync_logs
    WHERE id = log_id;
    
    UPDATE xs2_sync_logs
    SET 
        completed_at = NOW(),
        duration_ms = duration_ms,
        inserted_count = log_xs2_sync_complete.inserted_count,
        updated_count = log_xs2_sync_complete.updated_count,
        error_count = log_xs2_sync_complete.error_count,
        status = CASE WHEN error_count > 0 THEN 'error' ELSE 'completed' END,
        error_message = log_xs2_sync_complete.error_message
    WHERE id = log_id;
END;
$$;

-- Note: To actually trigger the edge function from pg_cron, you'll need to:
-- 1. Use the pg_net extension (if available) for HTTP calls, OR
-- 2. Use Supabase Database Webhooks, OR
-- 3. Use an external cron service to call the edge function

-- Example: If using pg_net extension, you could create this function:
/*
CREATE OR REPLACE FUNCTION trigger_xs2_sync_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    service_role_key TEXT;
    project_ref TEXT;
    function_url TEXT;
BEGIN
    -- Get service role key from settings (you'll need to set this)
    service_role_key := current_setting('app.settings.service_role_key', true);
    project_ref := current_setting('app.settings.project_ref', true);
    
    -- Construct the edge function URL
    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/sync-xs2';
    
    -- Call the edge function
    PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || service_role_key,
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
END;
$$;
*/

-- Example cron schedule (uncomment and adjust if using pg_net):
/*
SELECT cron.schedule(
    'sync-xs2-daily',
    '0 2 * * *',  -- Daily at 2 AM UTC
    'SELECT trigger_xs2_sync_edge_function();'
);
*/

-- For easier setup, we recommend using Supabase Database Webhooks or an external cron service
-- See docs/XS2_SYNC_EDGE_FUNCTION.md for complete setup instructions

