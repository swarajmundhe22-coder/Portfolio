import { useEffect, useState, useCallback, useRef } from 'react';

export interface GitHubContributionData {
  username: string;
  totalContributions: number;
  contributionCells: Array<{
    date: string;
    count: number;
    level: number;
  }>;
  lastUpdated: string;
}

export interface UseGitHubContributionsReturn {
  data: GitHubContributionData | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

const CACHE_DURATION = 3600_000; // 1 hour
const CACHE_KEY = 'github-contributions-cache';

/**
 * Hook to fetch and cache GitHub contribution data
 * Automatically falls back to static data if API fails
 * Only attempts to fetch once per component mount
 */
export function useGitHubContributions(
  fallbackData?: GitHubContributionData,
): UseGitHubContributionsReturn {
  const [data, setData] = useState<GitHubContributionData | null>(fallbackData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const attemptedRef = useRef(false);

  const fetchContributions = useCallback(async () => {
    // Prevent multiple attempts during dev with React StrictMode
    if (attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          setData(parsed.data);
          setLoading(false);
          return;
        }
      }

      // Attempt to fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/github-contributions', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const apiData: GitHubContributionData = await response.json();

      // Cache the data
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: apiData,
          timestamp: Date.now(),
        }),
      );

      setData(apiData);
    } catch (err) {
      // Silently fall back to static data, don't spam console
      if (fallbackData) {
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackData]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  return {
    data,
    loading,
    error,
    retry: () => {
      // Clear cache and refetch
      attemptedRef.current = false;
      localStorage.removeItem(CACHE_KEY);
      fetchContributions();
    },
  };
}
