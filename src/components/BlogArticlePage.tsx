import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { blogPosts } from '../data/portfolioData';
import { fetchBlogPosts, type RenderedBlogPost } from '../lib/blogFeed';

const cinematicEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

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
    content: post.content,
    featuredImageUrl: `/project-${imageNumber}.jpg`,
    featuredImageSet: `/project-${imageNumber}.jpg 1x, /project-${imageNumber}.jpg 2x`,
    publishDateIso,
    publishDateLabel: post.date,
    readTimeLabel: post.readTime,
    authorName: 'Swaraj Mundhe',
  };
});

const normalizeSlug = (slug: string | undefined): string =>
  (slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<RenderedBlogPost[]>(staticFallbackPosts);
  const [loading, setLoading] = useState(true);

  const normalizedSlug = normalizeSlug(slug);

  useEffect(() => {
    let disposed = false;

    const loadPosts = async () => {
      try {
        const nextPosts = await fetchBlogPosts();
        if (!disposed && nextPosts.length > 0) {
          setPosts(nextPosts);
        }
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

    return () => {
      disposed = true;
    };
  }, []);

  const article = useMemo(
    () => posts.find((item) => item.slug === normalizedSlug) ?? null,
    [normalizedSlug, posts],
  );

  if (!loading && !article) {
    return (
      <section className="blog-article-page" aria-label="Blog article not found">
        <div className="blog-article-shell">
          <Link to="/blogs" className="blog-article-back">
            <ArrowLeft size={16} /> Back to blogs
          </Link>
          <h1>Article not found</h1>
          <p>The requested article does not exist or has been moved.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="blog-article-page" aria-label="Blog article">
      <motion.article
        className="blog-article-shell"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: cinematicEase }}
      >
        <Link to="/blogs" className="blog-article-back">
          <ArrowLeft size={16} /> Back to blogs
        </Link>

        {article ? (
          <>
            <img
              src={article.featuredImageUrl}
              srcSet={article.featuredImageSet}
              alt={article.title}
              className="blog-article-image"
              loading="eager"
            />

            <p className="blog-article-meta">
              <CalendarDays size={15} /> {article.publishDateLabel} - {article.readTimeLabel} - {article.authorName}
            </p>

            <h1>{article.title}</h1>
            <p className="blog-article-dek">{article.excerpt}</p>

            <div className="blog-article-body">
              {article.content.map((paragraph, index) => (
                <p key={`${article.slug}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>
          </>
        ) : (
          <div className="blog-article-loading" aria-hidden="true">
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        )}
      </motion.article>
    </section>
  );
};

export default BlogArticlePage;
