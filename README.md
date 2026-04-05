# Portfolio Replica And Realtime Upgrade

This project is a recording-matched portfolio rebuilt with realtime, data-driven widgets while preserving the original cinematic layout language.

## What Was Upgraded

1. 3D Cube (profile card)
- Implemented in [src/components/CubeWidget.tsx](src/components/CubeWidget.tsx)
- WebGL path with Three.js (ambient + directional light)
- Continuous X/Y rotation with a 12s cycle
- CSS 3D fallback when WebGL is unavailable

2. Interactive Globe (regional delivery card)
- Implemented in [src/components/GlobeWidget.tsx](src/components/GlobeWidget.tsx)
- D3 geo projection, graticule rendering, arc interpolation, and value tweening
- Realtime data poll (60s) from country metrics helper
- Tooltip, region focus pills, and zoom/reset control

3. Multi-timezone Digital Clock
- Implemented in [src/components/TimezoneClockWidget.tsx](src/components/TimezoneClockWidget.tsx)
- NTP-style offset sync via world time API
- Intl timezone formatting with moment-timezone fallback
- Realtime second-level updates + selectable timezone chips

4. Dynamic Blog Cards + Route Transition
- Implemented in [src/components/DynamicBlogCards.tsx](src/components/DynamicBlogCards.tsx)
- Pulls blog data from `/api/blogs`, with fallback content path
- Polling every 60s
- Staggered card reveal for incoming items
- Client-side history transition to `/blog/{slug}` with inline panel

## API Endpoints

- [api/blogs.js](api/blogs.js)
  - `GET /api/blogs`
  - Returns `{ posts: [...] }`
  - Uses Supabase `blogs` table when configured, otherwise serves fallback posts

- Existing endpoints remain:
  - [api/profile.js](api/profile.js)
  - [api/projects.js](api/projects.js)
  - [api/project.js](api/project.js)
  - [api/contact.js](api/contact.js)

- Auth and security endpoints:
  - [api/auth/register.js](api/auth/register.js)
  - [api/auth/login.js](api/auth/login.js)
  - [api/auth/refresh.js](api/auth/refresh.js)
  - [api/auth/logout.js](api/auth/logout.js)
  - [api/auth/me.js](api/auth/me.js)
  - [api/auth/mfa/setup.js](api/auth/mfa/setup.js)
  - [api/auth/mfa/verify.js](api/auth/mfa/verify.js)
  - [api/auth/telemetry.js](api/auth/telemetry.js)

See [SECURITY.md](SECURITY.md) for the full defense-in-depth model and operational guidance.

## Build Optimization Strategy

- Lazy boundaries in [src/App.tsx](src/App.tsx):
  - `CubeWidget`, `GlobeWidget`, `TimezoneClockWidget`, `DynamicBlogCards` now load through `React.lazy` + `Suspense`.
  - Blog chunk mount is deferred until section visibility.
- Manual chunk boundaries in [vite.config.ts](vite.config.ts):
  - `framework` (React + router)
  - `ui-motion` (Framer Motion + Lucide)
  - `viz-globe` (D3 geo/interpolate)
  - `viz-three` (Three.js)
  - `timezone-fallback` (moment-timezone)
  - `supabase-client`
  - `vendor`
- Network-level chunk verification test:
  - [tests/chunk-splitting.network.spec.ts](tests/chunk-splitting.network.spec.ts)

## Core Frontend Files

- [src/App.tsx](src/App.tsx): main composition and section orchestration
- [src/App.css](src/App.css): card-level visual styling and responsive behavior
- [src/lib/timezoneUtils.ts](src/lib/timezoneUtils.ts): NTP offset + timezone formatting
- [src/lib/blogFeed.ts](src/lib/blogFeed.ts): blog normalization/render shaping/fetch
- [src/lib/globeData.ts](src/lib/globeData.ts): country metric normalization/fetch

## Commands

1. Install
`npm.cmd install`

2. Dev server
`npm.cmd run dev`

3. Production build
`npm.cmd run build`

4. Lint
`npm.cmd run lint`

5. Unit tests (Vitest)
`npm.cmd run test:unit`

6. Cross-browser smoke tests (Playwright)
`npm.cmd run test:smoke`

7. Visual regression tests (Playwright)
`npm.cmd run test:visual`

8. Regenerate visual baselines
`npm.cmd run test:visual:update`

9. Chunk loading verification (Playwright)
`npm.cmd run test:chunks`

10. Pixelmatch parity gate (1440 / 768 / 375)
`npm.cmd run test:pixelmatch`

11. Performance comparison report
`npm.cmd run perf:compare`

12. Security dependency audit
`npm.cmd run security:audit`

## Visual And Parity Artifacts

- Extracted reference video frames:
  - [analysis/reference_video_162403](analysis/reference_video_162403)

- Playwright snapshots:
  - [tests/visual-regression.spec.ts-snapshots](tests/visual-regression.spec.ts-snapshots)

- Pixelmatch canonical references:
  - [analysis/pixelmatch-reference](analysis/pixelmatch-reference)

When visual baselines change, update pixelmatch references:

1. `npm.cmd run test:visual:update`
2. Copy current chromium full-page snapshots for `1440`, `768`, and `375` into [analysis/pixelmatch-reference](analysis/pixelmatch-reference)
3. `npm.cmd run test:pixelmatch`

## Quality Status

- Lint: passing
- Build: passing
- Unit tests: passing
- Smoke tests: passing
- Chunk loading tests: passing
- Pixelmatch 98% gate: passing for 1440 / 768 / 375
- Dependency security audit: passing (`0 vulnerabilities`)

## Performance Snapshot

Latest before/after report is generated at [analysis/perf/comparison-report.json](analysis/perf/comparison-report.json).

Key measured deltas:

- Total JS bundle bytes: `1,945,014 -> 1,948,706` (`-0.19%`, slight increase)
- Initial JS bytes: `425,471 -> 385,985` (`+9.28% reduction`)
- Total JS chunk count: `3 -> 11`
- Initial chunk count: `1 -> 4`
- Lazy chunk count: `2 -> 7` (`+5 lazy chunks`)
- TTI proxy (`domInteractive` average across measurable browsers): `3307.47ms -> 2108.9ms` (`+36.24% improvement`)
- Wall-clock loaded average: `6825.25ms -> 6369.5ms` (`+6.68% improvement`)

Per-browser deltas are available in the same report.
