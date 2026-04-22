import { createSecureHandler } from './_security.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = 'swarajmundhe22-coder';

/**
 * Fetches GitHub contribution data using GraphQL API
 * Returns contribution count and heatmap data for the past year
 */
export default createSecureHandler(
  {
    methods: ['GET'],
    auth: 'none',
    rateLimit: {
      windowMs: 3600_000, // 1 hour
      max: 10, // 10 requests per hour
    },
  },
  async (_req, res, { requestId }) => {
    if (!GITHUB_TOKEN) {
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'GitHub token is not configured.',
          requestId,
        },
      });
    }

    try {
      const query = `
        query {
          user(login: "${GITHUB_USERNAME}") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors.map(e => e.message).join(', ')}`);
      }

      const contributionData = data.data?.user?.contributionsCollection?.contributionCalendar;

      if (!contributionData) {
        throw new Error('Invalid response structure from GitHub API');
      }

      // Transform weeks and days into flat heatmap cells
      const cells = [];
      contributionData.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          // Determine intensity level (0-4)
          let level = 0;
          if (day.contributionCount > 0) {
            if (day.contributionCount >= 20) level = 4;
            else if (day.contributionCount >= 15) level = 3;
            else if (day.contributionCount >= 10) level = 2;
            else if (day.contributionCount >= 5) level = 1;
          }

          cells.push({
            date: day.date,
            count: day.contributionCount,
            level,
          });
        });
      });

      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return res.status(200).json({
        username: GITHUB_USERNAME,
        totalContributions: contributionData.totalContributions,
        contributionCells: cells,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${requestId}] GitHub API error:`, errorMessage);

      return res.status(500).json({
        error: {
          code: 'GITHUB_FETCH_FAILED',
          message: 'Failed to fetch GitHub contributions. Please try again later.',
          requestId,
        },
      });
    }
  },
);
