import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, X } from 'lucide-react';
import { blogPosts } from '../data/portfolioData';
import { fetchBlogPosts, type RenderedBlogPost } from '../lib/blogFeed';

interface DynamicBlogCardsProps {
  contentReady: boolean;
  skeletonIndexes: number[];
  visualRegressionMode?: boolean;
}

const parseBlogSlugFromPath = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const match = window.location.pathname.match(/^\/blog\/([a-z0-9-]+)$/i);
  return match ? decodeURIComponent(match[1]) : null;
};

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const staticFallbackPosts: RenderedBlogPost[] = blogPosts.map((post, index) => {
  const imageNumber = (index % 4) + 1;
  const publishDateIso = new Date(post.date).toISOString();

  return {
    slug: toSlug(post.title),
    title: post.title,
    excerpt: post.excerpt,
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
  const [activeSlug, setActiveSlug] = useState<string | null>(parseBlogSlugFromPath());
  const [newSlugs, setNewSlugs] = useState<Set<string>>(new Set());

  const activePost = useMemo(
    () => posts.find((post) => post.slug === activeSlug) ?? null,
    [activeSlug, posts],
  );

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const onPopState = () => {
      setActiveSlug(parseBlogSlugFromPath());
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openPost = (slug: string) => {
    const search = window.location.search;
    window.history.pushState({ slug }, '', `/blog/${encodeURIComponent(slug)}${search}`);
    setActiveSlug(slug);
  };

  const closePost = () => {
    const search = window.location.search;
    window.history.pushState({}, '', `/${search}`);
    setActiveSlug(null);
  };

  return (
    <>
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
                <button
                  type="button"
                  className="blog-card-link"
                  aria-haspopup="dialog"
                  aria-expanded={activeSlug === post.slug}
                  onClick={() => openPost(post.slug)}
                >
                  <img
                    src={post.featuredImageUrl}
                    srcSet={post.featuredImageSet}
                    loading="lazy"
                    alt=""
                    className="blog-card-media"
                  />
                  <header>
                    <p>
                      <CalendarDays size={14} /> {post.publishDateLabel} - {post.readTimeLabel}
                    </p>
                    <ArrowUpRight size={16} />
                  </header>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="tag-row">
                    <span>{post.authorName}</span>
                    <span>{post.readTimeLabel}</span>
                  </div>
                </button>
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

      <AnimatePresence>
        {activePost ? (
          <motion.aside
            className="blog-route-panel"
            role="dialog"
            aria-modal="true"
            aria-label={activePost.title}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <button type="button" className="blog-route-close" onClick={closePost}>
              <X size={16} />
              Close
            </button>
            <p className="blog-route-meta">
              {activePost.publishDateLabel} - {activePost.readTimeLabel} - {activePost.authorName}
            </p>
            <h4>{activePost.title}</h4>
            <p>{activePost.excerpt}</p>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default memo(DynamicBlogCards);
