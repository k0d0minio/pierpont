#!/usr/bin/env node

/**
 * Script to run the Realtime migration
 * This enables Realtime subscriptions for the schedule tables
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL')
  console.error('Required: SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)')
  process.exit(1)
}

// Use service role key if available, otherwise use anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running Realtime migration...')
  console.log('This will enable Realtime subscriptions for: Day, Entry, HotelBooking, BreakfastConfiguration\n')

  const migrationSQL = `
-- Enable Realtime on Day table
ALTER PUBLICATION supabase_realtime ADD TABLE "Day";

-- Enable Realtime on Entry table
ALTER PUBLICATION supabase_realtime ADD TABLE "Entry";

-- Enable Realtime on HotelBooking table
ALTER PUBLICATION supabase_realtime ADD TABLE "HotelBooking";

-- Enable Realtime on BreakfastConfiguration table
ALTER PUBLICATION supabase_realtime ADD TABLE "BreakfastConfiguration";
`

  try {
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 60)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct query if RPC doesn't work
          console.log('RPC method failed, trying alternative approach...')
          // Note: Direct ALTER PUBLICATION requires superuser, so this might not work
          // The user should run this in Supabase SQL Editor instead
          console.error('Error:', error.message)
          console.error('\n⚠️  This migration requires superuser privileges.')
          console.error('Please run the migration manually in the Supabase SQL Editor:')
          console.error('\n' + migrationSQL)
          process.exit(1)
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nVerifying Realtime is enabled...')

    // Verify the migration
    const { data, error: verifyError } = await supabase
      .from('pg_publication_tables')
      .select('tablename')
      .eq('pubname', 'supabase_realtime')
      .in('tablename', ['Day', 'Entry', 'HotelBooking', 'BreakfastConfiguration'])

    if (verifyError) {
      console.log('Could not verify (this is okay if using anon key)')
    } else {
      const enabledTables = data?.map(row => row.tablename) || []
      console.log('Enabled tables:', enabledTables.join(', '))
      
      const required = ['Day', 'Entry', 'HotelBooking', 'BreakfastConfiguration']
      const missing = required.filter(t => !enabledTables.includes(t))
      
      if (missing.length > 0) {
        console.warn('⚠️  Missing tables:', missing.join(', '))
        console.warn('Please verify in Supabase dashboard')
      } else {
        console.log('✅ All tables are enabled for Realtime!')
      }
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n⚠️  This migration requires superuser privileges.')
    console.error('Please run the migration manually in the Supabase SQL Editor:')
    console.error('\n' + migrationSQL)
    process.exit(1)
  }
}

runMigration()

