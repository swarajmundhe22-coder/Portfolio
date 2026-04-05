import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-expect-error Optional local plugin file is not committed with type declarations.
    const sourceTagsModule = await import('./.vite-source-tags.js') as {
      sourceTags?: () => ReturnType<typeof react>;
    };
    if (typeof sourceTagsModule.sourceTags === 'function') {
      plugins.push(sourceTagsModule.sourceTags());
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.info('Optional source tags plugin is not enabled.', error);
    }
  }
  return {
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            const normalizedId = id.replaceAll('\\', '/');
            if (!normalizedId.includes('/node_modules/')) {
              return undefined;
            }

            if (
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/react-router-dom/') ||
              normalizedId.includes('/react/') ||
              normalizedId.includes('/scheduler/')
            ) {
              return 'framework';
            }

            if (
              normalizedId.includes('/framer-motion/') ||
              normalizedId.includes('/lucide-react/')
            ) {
              return 'ui-motion';
            }

            if (
              normalizedId.includes('/d3-geo/') ||
              normalizedId.includes('/d3-interpolate/')
            ) {
              return 'viz-globe';
            }

            if (normalizedId.includes('/three/')) {
              return 'viz-three';
            }

            if (
              normalizedId.includes('/moment-timezone/') ||
              normalizedId.includes('/moment/')
            ) {
              return 'timezone-fallback';
            }

            if (normalizedId.includes('/@supabase/supabase-js/')) {
              return 'supabase-client';
            }

            return 'vendor';
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
      },
    },
  };
})
