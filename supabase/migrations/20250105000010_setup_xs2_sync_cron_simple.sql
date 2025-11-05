-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a simple table to trigger syncs (for webhook approach)
CREATE TABLE IF NOT EXISTS xs2_sync_triggers (
    id SERIAL PRIMARY KEY,
    trigger_type TEXT DEFAULT 'daily_sync',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_xs2_sync_triggers_triggered_at ON xs2_sync_triggers(triggered_at DESC);

-- Function to trigger the sync (inserts a record to trigger webhook)
CREATE OR REPLACE FUNCTION trigger_xs2_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert a record to trigger database webhook
    INSERT INTO xs2_sync_triggers (trigger_type, triggered_at, status)
    VALUES ('daily_sync', NOW(), 'triggered');
    
    -- Log the trigger
    RAISE NOTICE 'XS2 sync trigger activated at %', NOW();
END;
$$;

-- Schedule the cron job to run daily at 2 AM UTC
-- This calls the trigger function, which you can connect to a database webhook
SELECT cron.schedule(
    'xs2-sync-daily',
    '0 2 * * *',  -- Daily at 2 AM UTC (cron format: minute hour day month weekday)
    'SELECT trigger_xs2_sync();'
);

-- Alternative: If you have pg_net extension enabled, use direct HTTP call
-- Uncomment below if pg_net is available in your Supabase project

/*
-- First, enable pg_net extension (if available)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call Edge Function directly via HTTP
CREATE OR REPLACE FUNCTION call_xs2_sync_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_ref TEXT;
    service_role_key TEXT;
    function_url TEXT;
    response_status INTEGER;
BEGIN
    -- Get project ref from Supabase URL (you'll need to set this)
    -- You can get it from your SUPABASE_URL: https://YOUR_PROJECT_REF.supabase.co
    project_ref := current_setting('app.settings.project_ref', true);
    
    -- Get service role key from settings (set this via: ALTER DATABASE postgres SET app.settings.service_role_key = 'your-key')
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- If not set, you can hardcode (not recommended for production)
    -- project_ref := 'your-project-ref';
    -- service_role_key := 'your-service-role-key';
    
    IF project_ref IS NULL OR service_role_key IS NULL THEN
        RAISE EXCEPTION 'Project ref or service role key not configured. Set via: ALTER DATABASE postgres SET app.settings.project_ref = ''your-ref'';';
    END IF;
    
    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/sync-xs2';
    
    -- Call the edge function
    SELECT status INTO response_status
    FROM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || service_role_key,
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    
    RAISE NOTICE 'XS2 sync function called. Response status: %', response_status;
END;
$$;

-- Schedule using direct HTTP call
SELECT cron.schedule(
    'xs2-sync-daily-http',
    '0 2 * * *',
    'SELECT call_xs2_sync_edge_function();'
);
*/

-- View scheduled jobs
-- SELECT * FROM cron.job;

-- View job run history
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'xs2-sync-daily') ORDER BY start_time DESC LIMIT 10;

-- To manually trigger the sync (for testing)
-- SELECT trigger_xs2_sync();

-- To unschedule the job (if needed)
-- SELECT cron.unschedule('xs2-sync-daily');

