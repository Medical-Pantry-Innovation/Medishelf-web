import { createClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client.
 *
 * This module builds its client at import time, and @supabase/supabase-js
 * throws when the URL is missing — so without configuration every page in the
 * app fails to render, including ones that never touch Supabase.
 *
 * In development that turns a forgotten .env.local into a blank 500 on pages
 * such as /items/demo, which needs no backend at all. So development falls
 * back to a placeholder and says so loudly; requests against it fail, which is
 * the correct outcome for anything that genuinely needs a project.
 *
 * Production keeps the original behaviour and fails at startup, because a
 * deployment silently running against a placeholder would be far worse.
 */

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-anon-key'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isDevelopment = process.env.NODE_ENV === 'development'
const isConfigured = Boolean(url && anonKey)

if (!isConfigured) {
  if (!isDevelopment) {
    // A deployment running against a placeholder would look healthy and serve
    // nothing, so it must not start.
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
    )
  }

  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Using a placeholder client: pages render, but anything that reads or writes data will fail. ' +
      'Run `cp .env.example .env.local` and fill in your project to use login or the review queue.'
  )
}

export const supabaseIsConfigured = isConfigured

export const supabase = createClient(
  isConfigured ? url : PLACEHOLDER_URL,
  isConfigured ? anonKey : PLACEHOLDER_KEY
)
