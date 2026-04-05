import { isSupabaseConfigured, requireSupabase } from './_supabase.js';
import { createSecureHandler } from './_security.js';

export default createSecureHandler(
  {
    methods: ['GET'],
    auth: 'none',
    rateLimit: {
      windowMs: 60_000,
      max: 120,
    },
  },
  async (_req, res, { requestId }) => {
    if (!isSupabaseConfigured) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Profile service is not configured.',
          requestId,
        },
      });
    }

    const supabase = requireSupabase();
    const { data, error } = await supabase.from('profile').select('*').single();
    if (error) {
      throw new Error(`PROFILE_QUERY_FAILED:${error.message}`);
    }

    return res.status(200).json(data);
  },
);
