import { describe, expect, it } from 'vitest';
import { normalizeBlogPosts, toRenderedBlogPosts } from './blogFeed';

describe('blogFeed helpers', () => {
  it('normalizes slugs, truncates excerpts, and sorts by publish date', () => {
    const rows = [
      {
        title: 'Hello World 2026!',
        excerpt: 'a '.repeat(120),
        publishDateIso: '2026-03-01T10:00:00.000Z',
        authorName: 'A',
      },
      {
        slug: 'Custom Slug',
        title: 'Second',
        excerpt: 'short excerpt',
        publishDateIso: '2026-04-01T10:00:00.000Z',
        authorName: 'B',
      },
    ];

    const normalized = normalizeBlogPosts(rows);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].slug).toBe('custom-slug');
    expect(normalized[1].slug).toBe('hello-world-2026');
    expect(normalized[1].excerpt.endsWith('...')).toBe(true);
  });

  it('maps normalized rows into rendered metadata labels', () => {
    const rendered = toRenderedBlogPosts([
      {
        slug: 'post-a',
        title: 'Post A',
        excerpt: 'This text has enough words for read time math.',
        content: ['Paragraph 1', 'Paragraph 2'],
        featuredImageUrl: '/project-1.jpg',
        featuredImageSet: '/project-1.jpg 1x, /project-1.jpg 2x',
        publishDateIso: '2026-04-05T08:00:00.000Z',
        authorName: 'Swaraj',
      },
    ]);

    expect(rendered[0].publishDateLabel).toMatch(/2026/);
    expect(rendered[0].readTimeLabel).toMatch(/MIN READ/);
    expect(rendered[0].content).toHaveLength(2);
  });
});
