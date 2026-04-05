import { isSupabaseConfigured, requireSupabase } from './_supabase.js';
import { createSecureHandler } from './_security.js';

const fallbackPosts = [
  {
    slug: 'frame-matching-a-portfolio-from-video-only',
    title: 'Frame-Matching a Portfolio From Video Only',
    excerpt:
      'How the interface was rebuilt from captured frames, with deterministic layout checks and quality gates.',
    featuredImageUrl: '/project-1.jpg',
    publishDateIso: '2026-04-05T08:00:00.000Z',
    authorName: 'Swaraj Mundhe',
  },
  {
    slug: 'design-drift-is-a-ci-problem',
    title: 'Design Drift Is a CI Problem, Not a QA Problem',
    excerpt:
      'A practical workflow for screenshot assertions that block unreviewed visual changes before release.',
    featuredImageUrl: '/project-2.jpg',
    publishDateIso: '2026-04-04T08:00:00.000Z',
    authorName: 'Swaraj Mundhe',
  },
  {
    slug: 'building-reliable-contact-pipelines-with-supabase',
    title: 'Building Reliable Contact Pipelines With Supabase',
    excerpt:
      'Lessons from validation boundaries, storage contracts, and production-safe serverless form ingestion.',
    featuredImageUrl: '/project-3.jpg',
    publishDateIso: '2026-04-03T08:00:00.000Z',
    authorName: 'Swaraj Mundhe',
  },
  {
    slug: 'motion-values-that-feel-premium-at-60-fps',
    title: 'Motion Values That Feel Premium at 60 FPS',
    excerpt:
      'Why easing and timing discipline deliver better product feel than decorative animation volume.',
    featuredImageUrl: '/project-4.jpg',
    publishDateIso: '2026-04-01T08:00:00.000Z',
    authorName: 'Swaraj Mundhe',
  },
  {
    slug: 'responsive-qa-checklist-for-320-to-1440-widths',
    title: 'Responsive QA Checklist for 320 to 1440 Widths',
    excerpt:
      'A repeatable viewport strategy for layout integrity from compact mobile screens to wide desktop.',
    featuredImageUrl: '/project-1.jpg',
    publishDateIso: '2026-03-30T08:00:00.000Z',
    authorName: 'Swaraj Mundhe',
  },
  {
    slug: 'accessibility-contrast-audits-without-guesswork',
    title: 'Accessibility Contrast Audits Without Guesswork',
    excerpt:
      'Tokenized color workflows that keep WCAG contrast decisions measurable and repeatable.',
    featuredImageUrl: '/project-2.jpg',
    publishDateIso: '2026-03-28T08:00:00.000Z',
    authorName: 'Swaraj Mundhe',
  },
];

export default createSecureHandler(
  {
    methods: ['GET'],
    auth: 'none',
    rateLimit: {
      windowMs: 60_000,
      max: 120,
    },
  },
  async (_req, res) => {
    if (!isSupabaseConfigured) {
      return res.status(200).json({ posts: fallbackPosts });
    }

    try {
      const supabase = requireSupabase();
      const { data, error } = await supabase
        .from('blogs')
        .select('slug, title, excerpt, featured_image_url, publish_date_iso, author_name')
        .order('publish_date_iso', { ascending: false })
        .limit(6);

      if (error || !Array.isArray(data) || data.length === 0) {
        return res.status(200).json({ posts: fallbackPosts });
      }

      const normalized = data.map((row, index) => ({
        slug: row.slug || fallbackPosts[index % fallbackPosts.length].slug,
        title: row.title || fallbackPosts[index % fallbackPosts.length].title,
        excerpt: row.excerpt || fallbackPosts[index % fallbackPosts.length].excerpt,
        featuredImageUrl:
          row.featured_image_url || fallbackPosts[index % fallbackPosts.length].featuredImageUrl,
        publishDateIso: row.publish_date_iso || fallbackPosts[index % fallbackPosts.length].publishDateIso,
        authorName: row.author_name || fallbackPosts[index % fallbackPosts.length].authorName,
      }));

      return res.status(200).json({ posts: normalized });
    } catch {
      return res.status(200).json({ posts: fallbackPosts });
    }
  },
);
