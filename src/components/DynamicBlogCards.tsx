import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/portfolioData';
import CinematicImage from './CinematicImage';
import { fetchBlogPosts, type RenderedBlogPost } from '../lib/blogFeed';

interface DynamicBlogCardsProps {
  contentReady: boolean;
  skeletonIndexes: number[];
  visualRegressionMode?: boolean;
}

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const audienceBySlug: Record<string, string> = {
  'why-react-threejs-real-time-simulation-for-infrastructure-intelligence': 'Founders and infrastructure teams',
  'frame-matching-a-portfolio-from-video-only': 'Frontend teams',
  'design-drift-is-a-ci-problem-not-a-qa-problem': 'Frontend platform and QA teams',
  'design-drift-is-a-ci-problem': 'Frontend platform and QA teams',
  'building-reliable-contact-pipelines-with-supabase': 'Founders and product teams',
  'motion-values-that-feel-premium-at-60-fps': 'Frontend and design-system teams',
  'responsive-qa-checklist-for-320-to-1440-widths': 'QA and product delivery teams',
  'accessibility-contrast-audits-without-guesswork': 'Product and accessibility teams',
  'debugging-frontend-incidents-before-users-notice': 'Frontend incident response teams',
};

const resolveAudienceLabel = (post: RenderedBlogPost): string =>
  audienceBySlug[post.slug] ??
  audienceBySlug[toSlug(post.title)] ??
  'Product and engineering teams';

const staticFallbackPosts: RenderedBlogPost[] = blogPosts.map((post, index) => {
  const imageNumber = (index % 4) + 1;
  const publishDateIso = new Date(post.date).toISOString();

  return {
    slug: toSlug(post.title),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    featuredImageUrl: `/project-${imageNumber}.jpg`,
    featuredImageSet: `/project-${imageNumber}.jpg 1x, /project-${imageNumber}.jpg 2x`,
    publishDateIso,
    publishDateLabel: post.date,
    readTimeLabel: post.readTime,
    authorName: 'Swaraj Mundhe',
  };
});

const DynamicBlogCards = ({
  contentReady,
  skeletonIndexes,
  visualRegressionMode,
}: DynamicBlogCardsProps) => {
  const [posts, setPosts] = useState<RenderedBlogPost[]>(staticFallbackPosts);
  const [loading, setLoading] = useState(true);
  const [newSlugs, setNewSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!contentReady) {
      setLoading(true);
      return;
    }

    if (visualRegressionMode) {
      setPosts(staticFallbackPosts);
      setLoading(false);
      return;
    }

    let disposed = false;

    const loadPosts = async () => {
      try {
        const nextPosts = await fetchBlogPosts();
        if (disposed || nextPosts.length === 0) {
          return;
        }

        setPosts((current) => {
          const currentSlugs = new Set(current.map((item) => item.slug));
          const incoming = new Set(
            nextPosts
              .map((item) => item.slug)
              .filter((slug) => !currentSlugs.has(slug)),
          );

          if (incoming.size > 0) {
            setNewSlugs(incoming);
          }

          return nextPosts;
        });
      } catch {
        if (!disposed) {
          setPosts(staticFallbackPosts);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    loadPosts();
    const poll = window.setInterval(loadPosts, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(poll);
    };
  }, [contentReady, visualRegressionMode]);

  useEffect(() => {
    if (newSlugs.size === 0) {
      return;
    }

    const timeout = window.setTimeout(() => setNewSlugs(new Set()), 1600);
    return () => window.clearTimeout(timeout);
  }, [newSlugs]);

  return (
    <div className="blogs-grid">
      {contentReady && !loading
        ? posts.map((post, index) => (
            <motion.article
              key={post.slug}
              className={`blog-card ${newSlugs.has(post.slug) ? 'is-new' : ''}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                className="blog-card-link"
                aria-label={`Open full article: ${post.title}`}
                to={`/blogs/${encodeURIComponent(post.slug)}`}
              >
                <CinematicImage
                  className="blog-card-media"
                  src={post.featuredImageUrl}
                  srcSet={post.featuredImageSet}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  alt=""
                />
                <header>
                  <p>
                    <CalendarDays size={14} /> {post.publishDateLabel} - {post.readTimeLabel}
                  </p>
                  <ArrowUpRight size={16} />
                </header>
                <h3>{post.title}</h3>
                <p className="blog-card-audience">For {resolveAudienceLabel(post)}</p>
                <p>{post.excerpt}</p>
                <div className="tag-row">
                  <span>{post.authorName}</span>
                  <span>{post.readTimeLabel}</span>
                </div>
              </Link>
            </motion.article>
          ))
        : skeletonIndexes.map((index) => (
            <article key={`blog-skeleton-${index}`} className="blog-card skeleton-card" aria-hidden="true">
              <div className="skeleton-line short" />
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </article>
          ))}
    </div>
  );
};

export default memo(DynamicBlogCards);
