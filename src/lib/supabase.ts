import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-supabase-anon-key'
  );
};

// Startup verification without exposing keys
if (typeof window !== 'undefined') {
  if (!isSupabaseConfigured()) {
    console.warn(
      '[VYUGAM 2.0] Supabase credentials not detected or using placeholder values. Running in offline demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for live multi-device synchronization.'
    );
  } else {
    console.info(
      `[VYUGAM 2.0] Connected to Supabase PostgreSQL at: ${supabaseUrl.replace(/(https?:\/\/).*/, '$1[configured]')}`
    );
  }
}

// Create client if configured, otherwise create dummy client that fails gracefully
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: { persistSession: false },
    });
