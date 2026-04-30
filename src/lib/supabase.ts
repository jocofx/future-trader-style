import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars. Check .env file.')
}

// Untyped client — avoids 'never' Insert/Update conflicts with Supabase v2 strict schema
// All query results are cast to our own types in the hooks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
}) as any // eslint-disable-line @typescript-eslint/no-explicit-any
