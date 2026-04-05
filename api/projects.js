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
          message: 'Projects service is not configured.',
          requestId,
        },
      });
    }

    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('year', { ascending: false });

    if (error) {
      throw new Error(`PROJECTS_QUERY_FAILED:${error.message}`);
    }

    return res.status(200).json(data ?? []);
  },
);
