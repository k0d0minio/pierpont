#!/usr/bin/env node

/**
 * Script to display the Realtime migration SQL
 * Run this SQL in your Supabase SQL Editor
 */

const migrationSQL = `-- Enable Realtime for schedule tables
-- This allows clients to subscribe to database changes in real-time

-- Enable Realtime on Day table
ALTER PUBLICATION supabase_realtime ADD TABLE "Day";

-- Enable Realtime on Entry table
ALTER PUBLICATION supabase_realtime ADD TABLE "Entry";

-- Enable Realtime on HotelBooking table
ALTER PUBLICATION supabase_realtime ADD TABLE "HotelBooking";

-- Enable Realtime on BreakfastConfiguration table
ALTER PUBLICATION supabase_realtime ADD TABLE "BreakfastConfiguration";`

console.log('='.repeat(70))
console.log('REALTIME MIGRATION SQL')
console.log('='.repeat(70))
console.log('\nCopy and paste this SQL into your Supabase SQL Editor:\n')
console.log(migrationSQL)
console.log('\n' + '='.repeat(70))
console.log('\nTo verify the migration worked, run this query:')
console.log('\nSELECT')
console.log('  schemaname,')
console.log('  tablename')
console.log('FROM pg_publication_tables')
console.log('WHERE pubname = \'supabase_realtime\'')
console.log('  AND tablename IN (\'Day\', \'Entry\', \'HotelBooking\', \'BreakfastConfiguration\');')
console.log('\n' + '='.repeat(70))

