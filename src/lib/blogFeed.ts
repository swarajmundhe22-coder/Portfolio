import { blogPosts } from '../data/portfolioData';
import { buildBlogCoverSet, resolveBlogCover } from './blogCovers';

export interface RawBlogPost {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string[] | string;
  featuredImageUrl?: string;
  publishDateIso?: string;
  authorName?: string;
}

export interface BlogPostModel {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  featuredImageUrl: string;
  featuredImageSet: string;
  publishDateIso: string;
  authorName: string;
}

const maxBlogPosts = 8;

const normalizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const ensureIso = (value: string): string => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }

  return new Date(parsed).toISOString();
};

const ensureExcerpt = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'No excerpt available.';
  }

  if (trimmed.length <= 140) {
    return trimmed;
  }

  return `${trimmed.slice(0, 137).trimEnd()}...`;
};

const ensureContent = (value: string[] | string | undefined, excerpt: string): string[] => {
  if (Array.isArray(value)) {
    const normalized = value.map((paragraph) => paragraph.trim()).filter(Boolean);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  if (typeof value === 'string' && value.trim()) {
    const normalized = value
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [ensureExcerpt(excerpt)];
};

export const normalizeBlogPosts = (rows: RawBlogPost[]): BlogPostModel[] =>
  rows
    .map((row, index) => {
      const title = row.title?.trim() || `Untitled Post ${index + 1}`;
      const slug = normalizeSlug(row.slug?.trim() || title || `post-${index + 1}`) || `post-${index + 1}`;
      const featuredImageUrl = row.featuredImageUrl?.trim() || resolveBlogCover(slug, title, index);

      return {
        slug,
        title,
        excerpt: ensureExcerpt(row.excerpt || ''),
        content: ensureContent(row.content, row.excerpt || ''),
        featuredImageUrl,
        featuredImageSet: buildBlogCoverSet(featuredImageUrl),
        publishDateIso: ensureIso(row.publishDateIso || ''),
        authorName: row.authorName?.trim() || 'Unknown Author',
      };
    })
    .sort((a, b) => Date.parse(b.publishDateIso) - Date.parse(a.publishDateIso))
    .slice(0, maxBlogPosts);

const toLocaleDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate));

const extractReadingTime = (excerpt: string, content: string[]): string => {
  const words = `${excerpt} ${content.join(' ')}`.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 120));
  return `${minutes} MIN READ`;
};

export interface RenderedBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  featuredImageUrl: string;
  featuredImageSet: string;
  publishDateIso: string;
  publishDateLabel: string;
  readTimeLabel: string;
  authorName: string;
}

export const toRenderedBlogPosts = (posts: BlogPostModel[]): RenderedBlogPost[] =>
  posts.map((post) => ({
    ...post,
    publishDateLabel: toLocaleDate(post.publishDateIso),
    readTimeLabel: extractReadingTime(post.excerpt, post.content),
  }));

const countWords = (content: string[]): number =>
  content.join(' ').split(/\s+/).filter(Boolean).length;

const curatedFallbackPosts: RenderedBlogPost[] = blogPosts
  .map((post, index) => {
    const slug = normalizeSlug(post.title);
    const featuredImageUrl = resolveBlogCover(slug, post.title, index);
    const publishDateIso = ensureIso(post.date);
    const content = ensureContent(post.content, post.excerpt);

    return {
      slug,
      title: post.title,
      excerpt: ensureExcerpt(post.excerpt),
      content,
      featuredImageUrl,
      featuredImageSet: buildBlogCoverSet(featuredImageUrl),
      publishDateIso,
      publishDateLabel: toLocaleDate(publishDateIso),
      readTimeLabel: extractReadingTime(post.excerpt, content),
      authorName: 'Swaraj Mundhe',
    };
  })
  .sort((a, b) => Date.parse(b.publishDateIso) - Date.parse(a.publishDateIso))
  .slice(0, maxBlogPosts);

const mergeWithCuratedFallback = (remotePosts: RenderedBlogPost[]): RenderedBlogPost[] => {
  const curatedBySlug = new Map(curatedFallbackPosts.map((post) => [post.slug, post]));

  const mergedRemote = remotePosts.map((post) => {
    const curated = curatedBySlug.get(post.slug) ?? curatedBySlug.get(normalizeSlug(post.title));
    if (!curated) {
      return post;
    }

    const remoteWordCount = countWords(post.content);
    const curatedWordCount = countWords(curated.content);
    const remoteAlreadyDetailed = remoteWordCount >= 220;

    if (remoteAlreadyDetailed || curatedWordCount <= remoteWordCount) {
      return post;
    }

    return {
      ...post,
      title: curated.title,
      excerpt: curated.excerpt,
      content: curated.content,
      readTimeLabel: curated.readTimeLabel,
      authorName: post.authorName === 'Unknown Author' ? curated.authorName : post.authorName,
    };
  });

  const seen = new Set(mergedRemote.map((post) => post.slug));
  const withMissingCurated = [
    ...mergedRemote,
    ...curatedFallbackPosts.filter((post) => !seen.has(post.slug)),
  ];

  return withMissingCurated
    .sort((a, b) => Date.parse(b.publishDateIso) - Date.parse(a.publishDateIso))
    .slice(0, maxBlogPosts);
};

const blogEndpoint = '/api/blogs';

export const fetchBlogPosts = async (signal?: AbortSignal): Promise<RenderedBlogPost[]> => {
  const response = await fetch(blogEndpoint, {
    method: 'GET',
    signal,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch blog posts (${response.status})`);
  }

  const payload = (await response.json()) as { posts?: RawBlogPost[] } | RawBlogPost[];
  const rows = Array.isArray(payload) ? payload : payload.posts ?? [];

  return mergeWithCuratedFallback(toRenderedBlogPosts(normalizeBlogPosts(rows)));
};
