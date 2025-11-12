# Real-time Updates Setup Guide

## Prerequisites

Real-time updates require that Supabase Realtime is enabled for your tables. Follow these steps:

## Step 1: Run the Migration

The migration file `supabase/migrations/20250201_enable_realtime.sql` must be run in your Supabase database.

### Option A: Using Supabase CLI
```bash
supabase db push
```

### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
-- Enable Realtime on Day table
ALTER PUBLICATION supabase_realtime ADD TABLE "Day";

-- Enable Realtime on Entry table
ALTER PUBLICATION supabase_realtime ADD TABLE "Entry";

-- Enable Realtime on HotelBooking table
ALTER PUBLICATION supabase_realtime ADD TABLE "HotelBooking";

-- Enable Realtime on BreakfastConfiguration table
ALTER PUBLICATION supabase_realtime ADD TABLE "BreakfastConfiguration";
```

## Step 2: Verify Realtime is Enabled

Run this query in the Supabase SQL Editor to verify:

```sql
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('Day', 'Entry', 'HotelBooking', 'BreakfastConfiguration');
```

You should see all 4 tables listed.

## Step 3: Check Browser Console

1. Open your application in the browser
2. Open Developer Tools (F12) and go to the Console tab
3. Look for these messages:
   - "Day schedule hook: Setting up subscriptions for day: ..."
   - "Successfully subscribed to entry changes for day: ..."
   - "Month schedule hook: Setting up subscriptions for month: ..."

If you see "CHANNEL_ERROR" or connection errors, check:
- Your Supabase project has Realtime enabled (check project settings)
- Your environment variables are correct
- The migration has been run

## Step 4: Test Real-time Updates

1. Open the app in two browser tabs
2. In one tab, create/edit/delete an entry
3. Check the console in both tabs for:
   - "Entry change received: INSERT/UPDATE/DELETE"
   - The payload data
4. The other tab should update automatically

## Troubleshooting

### No subscription messages in console
- Check that the migration was run
- Verify Realtime is enabled in Supabase project settings
- Check browser console for errors

### "CHANNEL_ERROR" messages
- Verify your Supabase URL and anon key are correct
- Check that Realtime is enabled for your Supabase project
- Ensure the tables exist and have the correct names

### Subscriptions connect but no updates
- Check that the migration was run (Step 2)
- Verify the table names match exactly (case-sensitive)
- Check console logs for "Entry change received" messages

