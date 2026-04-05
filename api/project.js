import { isSupabaseConfigured, requireSupabase } from './_supabase.js';
import { createSecureHandler } from './_security.js';

export default createSecureHandler(
  {
    methods: ['GET'],
    auth: 'none',
    rateLimit: {
      windowMs: 60_000,
      max: 100,
    },
  },
  async (_req, res, { requestId }) => {
    if (!isSupabaseConfigured) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Project detail service is not configured.',
          requestId,
        },
      });
    }

    const supabase = requireSupabase();

    const [{ data: info, error: infoError }, { data: report, error: reportError }, { data: timeline, error: timelineError }, { data: bom, error: bomError }, { data: slides, error: slidesError }] = await Promise.all([
      supabase.from('project_info').select('*').single(),
      supabase.from('report_content').select('*').order('order_index', { ascending: true }),
      supabase.from('timeline_events').select('*').order('date', { ascending: true }),
      supabase.from('bom_items').select('*').order('id', { ascending: true }),
      supabase.from('slides').select('*').order('order_index', { ascending: true }),
    ]);

    const firstError = infoError || reportError || timelineError || bomError || slidesError;
    if (firstError) {
      throw new Error(`PROJECT_QUERY_FAILED:${firstError.message}`);
    }

    return res.status(200).json({
      info,
      report: report ?? [],
      timeline: timeline ?? [],
      bom: bom ?? [],
      slides: slides ?? [],
    });
  },
);
