import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl) && Boolean(supabaseServiceRoleKey);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'agon-agent-api',
        },
      },
    })
  : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  return supabase;
};

export { isSupabaseConfigured };

export default supabase;
