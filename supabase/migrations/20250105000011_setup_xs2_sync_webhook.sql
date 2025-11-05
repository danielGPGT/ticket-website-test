-- Instructions for setting up Database Webhook to call Edge Function
-- This is the EASIEST way to connect pg_cron to your Edge Function

-- Step 1: The cron job is already set up in migration 20250105000010
-- It will insert into xs2_sync_triggers table daily at 2 AM UTC

-- Step 2: Set up Database Webhook in Supabase Dashboard:
-- 1. Go to Database > Webhooks
-- 2. Click "Create a new webhook"
-- 3. Configure:
--    - Name: xs2-sync-webhook
--    - Table: xs2_sync_triggers
--    - Events: After Insert
--    - Type: HTTP Request
--    - HTTP Method: POST
--    - URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-xs2
--    - HTTP Headers:
--      Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--      Content-Type: application/json
-- 4. Save

-- Step 3: Test the webhook
-- Run this SQL to test:
-- SELECT trigger_xs2_sync();

-- The webhook will automatically call your Edge Function when a record is inserted!

-- Optional: Create a view to monitor sync triggers
CREATE OR REPLACE VIEW xs2_sync_status AS
SELECT 
    trigger_type,
    COUNT(*) as total_triggers,
    MAX(triggered_at) as last_triggered,
    COUNT(*) FILTER (WHERE status = 'triggered') as successful_triggers
FROM xs2_sync_triggers
GROUP BY trigger_type;

-- View recent sync triggers
-- SELECT * FROM xs2_sync_triggers ORDER BY triggered_at DESC LIMIT 10;

-- View sync status summary
-- SELECT * FROM xs2_sync_status;

