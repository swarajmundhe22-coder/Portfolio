export interface RawBlogPost {
  slug?: string;
  title?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  publishDateIso?: string;
  authorName?: string;
}

export interface BlogPostModel {
  slug: string;
  title: string;
  excerpt: string;
  featuredImageUrl: string;
  featuredImageSet: string;
  publishDateIso: string;
  authorName: string;
}

const fallbackImage = '/project-2.jpg';

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

export const normalizeBlogPosts = (rows: RawBlogPost[]): BlogPostModel[] =>
  rows
    .map((row, index) => {
      const title = row.title?.trim() || `Untitled Post ${index + 1}`;
      const slug = normalizeSlug(row.slug?.trim() || title || `post-${index + 1}`) || `post-${index + 1}`;
      const featuredImageUrl = row.featuredImageUrl?.trim() || fallbackImage;

      return {
        slug,
        title,
        excerpt: ensureExcerpt(row.excerpt || ''),
        featuredImageUrl,
        featuredImageSet: `${featuredImageUrl}?w=480 1x, ${featuredImageUrl}?w=960 2x`,
        publishDateIso: ensureIso(row.publishDateIso || ''),
        authorName: row.authorName?.trim() || 'Unknown Author',
      };
    })
    .sort((a, b) => Date.parse(b.publishDateIso) - Date.parse(a.publishDateIso))
    .slice(0, 6);

const toLocaleDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate));

const extractReadingTime = (excerpt: string): string => {
  const words = excerpt.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 120));
  return `${minutes} MIN READ`;
};

export interface RenderedBlogPost {
  slug: string;
  title: string;
  excerpt: string;
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
    readTimeLabel: extractReadingTime(post.excerpt),
  }));

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

  return toRenderedBlogPosts(normalizeBlogPosts(rows));
};
