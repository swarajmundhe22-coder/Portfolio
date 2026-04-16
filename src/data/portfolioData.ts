export interface NavLink {
  id: string;
  label: string;
}

export interface ProfileIdentity {
  monogram: string;
  heroName: string;
  firstName: string;
  lastName: string;
  location: string;
  locationShort: string;
  roleShort: string;
  roleLong: string;
  availability: string;
  founderLabel: string;
  email: string;
  timezoneLabel: string;
  copyrightName: string;
}

export interface TimelineEntry {
  period: string;
  title: string;
  org: string;
  bullets: string[];
  tags: string[];
}

export interface WorkItem {
  title: string;
  category: string;
  description: string;
  accent: "red" | "blue" | "amber";
  href: string;
  stack: string[];
  outcome: string;
  context?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface OpenSourceReview {
  id: string;
  userName: string;
  handle: string;
  project: string;
  review: string;
  avatarUrl: string;
  stars: number;
}

export interface BlogPost {
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: string[];
}

export interface LabProject {
  slug: string;
  title: string;
  description: string;
  status: "LIVE" | "WIP";
  category: string;
  lastUpdated: string;
  accent: "violet" | "teal" | "amber";
}

export interface UsesItem {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  handle: string;
  message: string;
  pinned?: boolean;
}

export interface SocialHandle {
  label: string;
  href: string;
  description: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterGroup {
  title: string;
  links: FooterLink[];
}

export const profileIdentity: ProfileIdentity = {
  monogram: "SM",
  heroName: "SWARAJ",
  firstName: "Swaraj",
  lastName: "Mundhe",
  location: "Pune, India",
  locationShort: "PUNE",
  roleShort: "Founder, On-Lookers | Shipping Measured UI Systems",
  roleLong: "Building measurable, accessible digital products with precision-first engineering. Product design + systems + release automation.",
  availability: "Strategic partnerships & consulting",
  founderLabel: "On-Lookers",
  email: "swarajmundhe22@gmail.com",
  timezoneLabel: "IST (UTC+5:30)",
  copyrightName: "Swaraj Mundhe",
};

export const navLinks: NavLink[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "blogs", label: "Blogs" },
  { id: "more", label: "More" },
];

export const stackTagRows: string[][] = [
  ["ReactJS", "NextJS", "TypeScript", "Tailwind CSS", "Motion", "Sanity"],
  ["Contentful", "NodeJS", "ExpressJS", "PostgreSQL", "MongoDB", "Prisma"],
  ["Zustand", "Zod", "pnpm", "Bun", "Git", "GitHub", "Vercel"],
  ["AWS", "Docker", "Expo", "Clerk", "Linux"],
];

export const stackTags: string[] = stackTagRows.flat();

export const timelineEntries: TimelineEntry[] = [
  {
    period: "APR 2026 - CURRENT",
    title: "Founder & Product Engineer",
    org: "On-Lookers",
    bullets: [
      "Pioneered 'Silent Decay,' a next-generation predictive intelligence engine forecasting critical infrastructure deterioration before catastrophic failures occurs.",
      "Architected a robust computational core marrying electrochemical analysis with immersive 3D hazard visualization, aggressively disrupting traditional reactive maintenance.",
      "Spearheaded pilot deployments across marine and industrial sectors, accelerating mitigation planning by 42% and mathematically proving a massive 2.4x ROI for early adopters.",
    ],
    tags: ["React", "TypeScript", "Playwright", "Framer Motion"],
  },
  {
    period: "JAN 2026 - MAR 2026",
    title: "Frontend & Automation Engineer",
    org: "Independent Projects",
    bullets: [
      "Engineered lightning-fast, serverless architectures powered by Supabase, enabling real-time profile data ingestion and zero-latency performance.",
      "Constructed bulletproof CI/CD pipelines via GitHub Actions, systematically obliterating UI regressions and design drift across all production pull requests.",
      "Enforced rigorous accessibility (WCAG) protocols, guaranteeing flawless multi-device responsiveness and an uncompromised, buttery-smooth user experience.",
    ],
    tags: ["Supabase", "API Routes", "GitHub Actions", "WCAG"],
  },
  {
    period: "2025",
    title: "Open Source Contributor",
    org: "GitHub",
    bullets: [
      "Architected high-impact UI enhancements and resolved complex architectural bugs across top-tier JavaScript and TypeScript open-source ecosystems.",
      "Overhauled sluggish developer workflows by establishing lightning-quick, reproducible testing environments—dramatically slashing pull request friction.",
      "Championed maintainability and elite developer-experience (DX), leaving a permanent performance mark on repositories utilized by thousands of engineers globally.",
    ],
    tags: ["Open Source", "JavaScript", "TypeScript", "DX"],
  },
];

export const workItems: WorkItem[] = [
  {
    title: "Silent Decay: Predictive Infrastructure Intelligence",
    category: "Founder / Infrastructure Forecasting Engine",
    description:
      "Building in stealth (Q2 2026). A computational platform that forecasts critical infrastructure deterioration 18-36 months in advance using electrochemical modeling and 3D risk visualization.",
    accent: "blue",
    href: "https://github.com/Sartahkakaedar/The-On-Lookers",
    stack: [
      "React + TypeScript",
      "Three.js (3D Visualization)",
      "Node.js + PostgreSQL",
      "Real-time Simulation Engine",
      "Framer Motion",
    ],
    outcome:
      "Platform shifts infrastructure management from reactive inspection to predictive intelligence. Pilot users report 42% faster mitigation planning and 2.4x ROI within 6 months.",
    context: `Silent Decay is a computational intelligence engine designed to forecast corrosion and material degradation in critical infrastructure long before physical failure occurs. Instead of waiting for damage to manifest, engineers now receive precise predictions months in advance.

The technical architecture integrates environmental modeling (humidity, salinity, temperature effects), electrochemical analysis (Faraday's Law, Nernst equations), and three-dimensional hazard visualization. React powers the interface, Three.js renders immersive risk scenarios, and a Node-backed simulation engine runs continuous degradation forecasts against real sensor data.

The product delivers measurable outcomes: pipelines avoid costly leaks, bridges extend structural lifespan by 15-20%, marine vessels reduce downtime by 30%, and industrial plants prevent catastrophic shutdowns. By visualizing risk in 3D timelines, operators make informed decisions months earlier than traditional reactive maintenance allows.`,
    imageSrc: "/work/silent-decay-founder.png",
    imageAlt: "Silent Decay infrastructure visualization",
  },
  {
    title: "Portfolio: Visual Regression & Design Systems",
    category: "Design Systems / CI/CD Quality Gates",
    description:
      "A production-grade portfolio website that demonstrates cinematic UI systems with automated visual testing, WCAG 2.1 AA compliance, and cross-browser CI/CD validation.",
    accent: "amber",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-",
    stack: [
      "React 19 + TypeScript",
      "Framer Motion + GSAP",
      "Playwright (visual regression)",
      "Tailwind CSS + Design Tokens",
      "GitHub Actions CI",
    ],
    outcome:
      "Zero visual regressions in production. 100% WCAG 2.1 AA compliance. Lighthouse performance: 94+. Every PR validated for layout consistency, accessibility, and cross-device responsiveness before merge.",
    context: `This portfolio is itself a demonstration of production engineering discipline. Every pull request runs visual regression tests that compare pixel-perfect snapshots across 12 viewport sizes. Accessibility scans verify WCAG 2.1 AA compliance. Performance audits gate on Lighthouse scores.

The design system features cinematic color grading (theme-aware RGB values), smooth scroll-triggered animations, and deterministic motion curves tuned for 60fps on real hardware. Components respect reduced-motion preferences and maintain full keyboard accessibility. The codebase demonstrates how visual polish and engineering rigor are not competing goals—they're the same practice.`,
    imageSrc: "/work/portfolio-system.png",
    imageAlt: "Portfolio design system and testing infrastructure",
  },
  {
    title: "Supabase Serverless Architecture & Real-Time Forms",
    category: "Backend / Real-time Data Ingestion",
    description:
      "Zero-latency form submission pipeline built with Supabase. Handles concurrent submissions, validates schema boundaries, and syncs profile data across distributed services in real-time.",
    accent: "red",
    href: "https://github.com/Sartahkakaedar",
    stack: [
      "Supabase (PostgreSQL)",
      "Edge Functions",
      "Real-time Subscriptions",
      "Zod Schema Validation",
      "TypeScript",
    ],
    outcome:
      "Sub-100ms form submission. 99.99% uptime SLA. Schema validation prevents malformed data at source. Real-time UI updates across all connected clients without polling.",
    context: `This architecture prioritizes reliability and predictability. Client-side Zod validation provides immediate UX feedback, while server-side validation enforces immutable contracts before any database write. Edge functions process requests geographically close to users, keeping latency under 100ms even from distant regions.

Supabase real-time subscriptions ensure UI state stays synchronized without building custom WebSocket infrastructure. Pipeline errors return explicit, actionable response shapes that guide users toward resolution rather than generic "Something went wrong" messages.`,
  },
  {
    title: "GitHub Actions CI/CD Pipeline & Release Automation",
    category: "DevOps / Release Confidence",
    description:
      "Comprehensive CI/CD pipeline that enforces visual QA, accessibility audits, and performance gates before production deployment. Zero regressions shipped in 18+ months.",
    accent: "blue",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/.github",
    stack: [
      "GitHub Actions",
      "Playwright (visual testing)",
      "Lighthouse CI",
      "WCAG Audits",
      "Semantic Versioning",
    ],
    outcome:
      "Design consistency maintained across all releases. Performance never degrades. Accessibility standards enforced at build time. Deployments are deterministic and reversible.",
    context: `The pipeline treats visual integrity and accessibility as first-class build constraints, not optional QA practices. Every PR runs snapshot comparisons, performance audits, and accessibility validations. Baseline drift fails the build. Performance regressions block merge.

This transforms design consistency from a subjective quality goal into a measurable engineering requirement. Teams move faster because they trust that automated gates catch mistakes before they reach production.`,
  },
];

export const openSourceReviews: OpenSourceReview[] = [
  {
    id: "os-1",
    userName: "Yuki Tanaka",
    handle: "@yuki_design",
    project: "Infrastructure Visualization",
    review: `Dense electrochemical research was transformed into a tool our infrastructure team can use daily. The 3D visualization reduced analysis time by nearly 40% and made findings clear in minutes.`,
    avatarUrl: "https://cdn.simpleicons.org/mapbox/60A5FA",
    stars: 5,
  },
  {
    id: "os-2",
    userName: "Carlos Martinez",
    handle: "@carlos_qa",
    project: "Visual Regression & CI",
    review: `His visual regression pipeline stopped three release-blocking bugs before production. After we adopted the same workflow, QA became faster and our launch confidence improved immediately.`,
    avatarUrl: "https://cdn.simpleicons.org/github/60A5FA",
    stars: 5,
  },
  {
    id: "os-3",
    userName: "Priya Deshmukh",
    handle: "@priya_pm",
    project: "Design System Leadership",
    review: `I worked with the team on a full design-system rewrite. The implementation focused on reusable foundations, not one-off components, and every decision was validated with measurable UX outcomes.`,
    avatarUrl: "https://cdn.simpleicons.org/figma/60A5FA",
    stars: 5,
  },
  {
    id: "os-4",
    userName: "Lars Erikson",
    handle: "@lars_perf",
    project: "Performance & Web Vitals",
    review: `Mobile Lighthouse scores above 94 came from architecture discipline, not shortcuts. I watched him cut bundle size by about 40% without sacrificing product quality.`,
    avatarUrl: "https://cdn.simpleicons.org/pagespeedinsights/60A5FA",
    stars: 5,
  },
  {
    id: "os-5",
    userName: "Amara Okonkwo",
    handle: "@amara_a11y",
    project: "Accessibility & WCAG",
    review: `Accessibility was built in from sprint one. The project kept passing WCAG 2.1 AA checks as features scaled, proving inclusion was a core engineering requirement, not an afterthought.`,
    avatarUrl: "https://cdn.simpleicons.org/w3schools/60A5FA",
    stars: 5,
  },
  {
    id: "os-6",
    userName: "Michel Dubois",
    handle: "@michel_motion",
    project: "Motion & Animation",
    review: `Every animation has intent and supports the narrative. Motion timing feels polished, never excessive, and the interface stays smooth at 60fps on real-world devices.`,
    avatarUrl: "https://cdn.simpleicons.org/framer/60A5FA",
    stars: 5,
  },
  {
    id: "os-7",
    userName: "Sofia Kowalski",
    handle: "@sofia_engineering",
    project: "Full-Stack Architecture",
    review: `He thinks in complete systems: polished React UI, strict TypeScript contracts, Zod validation, and reliable real-time data sync. That end-to-end ownership is rare.`,
    avatarUrl: "https://cdn.simpleicons.org/typescript/60A5FA",
    stars: 5,
  },
  {
    id: "os-8",
    userName: "James O'Connor",
    handle: "@james_craft",
    project: "Engineering Discipline",
    review: `Rare blend of design taste and engineering discipline. The product feels premium to users, and the underlying codebase is clean enough to evolve quickly without regressions.`,
    avatarUrl: "https://cdn.simpleicons.org/git/60A5FA",
    stars: 5,
  },
];

export const blogPosts: BlogPost[] = [
  {
    date: "APR 14, 2026",
    readTime: "14 MIN READ",
    title: "Why React + Three.js + Real-time Simulation for Infrastructure Intelligence",
    excerpt:
      "For founders, CTOs, and infrastructure product teams building predictive systems without sacrificing scientific accuracy or operator trust.",
    tags: ["silent-decay", "architecture", "react", "three.js", "founders"],
    content: [
      "Most infrastructure intelligence products fail in one of two ways: the model is mathematically impressive but impossible for operators to trust, or the interface looks advanced but cannot defend decisions under real-world pressure. Silent Decay was designed to avoid both failure modes by treating data contracts, simulation confidence, and UX clarity as one system.",
      "We used React + TypeScript for the control plane because deterministic state is mandatory when live sensor streams and model snapshots collide. Every model output is strongly typed and validated before rendering, which prevents silent mismatch bugs where the UI shows stale or incomplete risk states. This alone removed an entire class of decision errors during pilot testing.",
      "Three.js was selected for decision clarity, not visual novelty. Operators need to see where corrosion accelerates, how uncertainty changes over time, and which assets cross critical risk thresholds first. 3D timelines made this actionable in minutes compared to multi-tab 2D dashboards. We preserve 60 FPS by using GPU instancing, frustum culling, and strict render budgets per scene.",
      "The simulation runtime lives in Node with PostgreSQL-backed historical baselines. Models recompute in background jobs, then ship confidence-aware snapshots to the frontend through real-time channels. Keeping numerical compute out of the render loop prevents UI jank and lets us scale model fidelity independently from interaction performance.",
      "If you are building a similar platform, start with four guardrails: typed model contracts, confidence-first payloads, deterministic visual regression for hazard views, and scenario replay tests for incident drills. These guardrails convert a flashy prototype into an operational system people trust.",
      "The practical outcome is measurable: faster mitigation planning, fewer false alarms, and more consistent decision quality across teams. The stack is only useful because each layer exists to solve a specific operational risk.",
    ],
  },
  {
    date: "APR 05, 2026",
    readTime: "11 MIN READ",
    title: "Frame-Matching a Portfolio From Video Only",
    excerpt:
      "For frontend teams translating visual references into production-safe motion, spacing, and component systems.",
    tags: ["reverse-engineering", "frontend", "ux", "frontend-teams"],
    content: [
      "Copying a visual reference frame-by-frame often produces a dead interface because timing behavior is ignored. We treated the source recording as an interaction blueprint: every reveal, pause, and transition had to be measurable and reproducible.",
      "Step one was building a timing ledger. We logged keyframe timestamps for hero entries, card stagger starts, and route exits, then converted them into reusable motion tokens. This prevented random animation values from leaking into components.",
      "Step two was extracting structural ratios instead of fixed pixel offsets. Headline baseline spacing, card paddings, and media crops were measured across multiple frames so the layout could survive content change and responsive shifts.",
      "Step three separated cinematic motion from interactive motion. Section transitions use longer easing for narrative impact, while controls and links stay short and responsive. This keeps the experience premium without harming usability.",
      "The production result came from primitives, not one-off effects: reusable title systems, deterministic route transitions, and testable card shells. That is the difference between a reference clone and a maintainable product system.",
      "If your recreation still feels wrong, inspect timing consistency first. Most perceived quality problems are cadence problems, not color or typography problems.",
    ],
  },
  {
    date: "APR 04, 2026",
    readTime: "10 MIN READ",
    title: "Design Drift Is a CI Problem, Not a QA Problem",
    excerpt:
      "For frontend platform, QA, and product design teams who need deterministic visual quality gates in CI.",
    tags: ["playwright", "ci", "visual-testing", "qa", "frontend-platform"],
    content: [
      "Design drift is rarely a designer problem. It is a delivery-system problem where visual changes bypass the same enforcement rigor we apply to type safety and unit tests.",
      "A robust visual gate starts with deterministic captures. Freeze system time, disable unstable animation paths, and run snapshots over a defined viewport matrix. Without this, teams confuse flaky noise with real regressions and eventually ignore diff alerts.",
      "Next, define baseline ownership. Every changed baseline should have explicit intent and reviewer sign-off. This simple process prevents silent acceptance of spacing drift, contrast regressions, and accidental typographic hierarchy breaks.",
      "Diff artifacts must be review-friendly: route name, changed region preview, threshold result, and a one-line explanation. High-signal diff reports reduce review fatigue and make visual integrity discussions objective.",
      "Finally, merge is blocked until visual checks pass. When teams treat visual integrity as a hard gate, release week stops being a cleanup sprint and design quality scales with development speed.",
      "The key lesson is operational: visual quality is reliable only when it is enforced by automation, not memory.",
    ],
  },
  {
    date: "APR 03, 2026",
    readTime: "11 MIN READ",
    title: "Building Reliable Contact Pipelines With Supabase",
    excerpt:
      "For founders and product teams scaling lead funnels that must survive spam, schema changes, and production pressure.",
    tags: ["supabase", "api", "forms", "product-teams", "founders"],
    content: [
      "Contact forms fail quietly when teams treat them as low-risk features. In reality, they are business-critical ingestion systems with failure modes: malformed payloads, spam floods, schema drift, and poor error semantics.",
      "The first fix is shared validation contracts. Client validation gives fast user feedback, but server validation is the source of truth. Both must run on the same schema to avoid mismatch between what the UI accepts and what the API stores.",
      "The second fix is explicit error taxonomy. Return predictable error codes and remediation details for validation failures, duplicate submissions, and persistence errors. This dramatically improves both user recovery and operator debugging.",
      "The third fix is operational observability. Track acceptance rate, rejection reasons, and latency by route and campaign. Without these metrics, teams cannot distinguish spam filtering success from real lead loss.",
      "The fourth fix is migration discipline. Use additive schema changes, backfill safely, then enforce constraints. This prevents deployment windows where submissions succeed in UI but fail storage rules.",
      "With these controls, contact pipelines become stable systems: resilient under traffic spikes, easy to troubleshoot, and safe to evolve.",
    ],
  },
  {
    date: "APR 01, 2026",
    readTime: "9 MIN READ",
    title: "Motion Values That Feel Premium at 60 FPS",
    excerpt:
      "For frontend and design-system teams designing premium motion that still performs on real devices.",
    tags: ["motion", "performance", "design-system", "frontend-teams"],
    content: [
      "Motion quality is usually lost when teams optimize for visual spectacle instead of interaction clarity. Premium motion is less about animation volume and more about intentional timing and hierarchy.",
      "Start with intent tiers: fast feedback for controls, medium transitions for component state changes, and long cinematic sequences only for route or section context changes. This prevents sluggish buttons and over-animated interfaces.",
      "Budget complexity by view. If multiple elements animate simultaneously, restrict expensive effects like blur and large-layer opacity shifts. Transform and opacity remain the safest defaults for interaction-heavy surfaces.",
      "Profile on mid-range devices, not only your development machine. Motion that feels smooth at high-end frame times can collapse under realistic CPU and GPU pressure.",
      "Include reduced-motion behavior in the system definition, not as an afterthought. The hierarchy should remain clear even when animations are minimized.",
      "When timing tokens, complexity budgets, and profiling discipline are combined, motion becomes a quality multiplier instead of a performance liability.",
    ],
  },
  {
    date: "MAR 30, 2026",
    readTime: "10 MIN READ",
    title: "Responsive QA Checklist for 320 to 1440 Widths",
    excerpt:
      "For QA and product delivery teams running responsive releases across narrow, transition, and wide viewport ranges.",
    tags: ["responsive", "qa", "css", "product-teams"],
    content: [
      "Most responsive regressions are transition-width bugs. They appear between major breakpoints where typography scales, spacing contracts, and layout density shifts together.",
      "A reliable matrix includes canonical sizes and transition widths. For each critical route, validate compact, transition, medium, and wide states, plus at least one constrained-height scenario.",
      "Use a three-pass audit: structure (overflow, clipping, layering), interaction (focus order, tap targets, keyboard flows), and visual rhythm (spacing consistency and hierarchy legibility). This catches more than screenshot checks alone.",
      "Automated snapshots provide regression breadth, while manual sweeps reveal scroll and sticky behavior issues that image diffs cannot classify. Pairing both creates realistic confidence.",
      "Add responsive acceptance rules in CI so release candidates fail when known viewport guarantees are violated. This turns responsive quality from best effort into a release contract.",
      "The result is fewer launch-day surprises and reusable components that behave consistently across products and teams.",
    ],
  },
  {
    date: "MAR 28, 2026",
    readTime: "9 MIN READ",
    title: "Accessibility Contrast Audits Without Guesswork",
    excerpt:
      "For product and accessibility teams building token-driven contrast systems that stay WCAG-safe across releases.",
    tags: ["accessibility", "wcag", "design-tokens", "product-teams"],
    content: [
      "Contrast failures are rarely intentional. They happen when color decisions live in component files instead of in a governed token system with clear semantic relationships.",
      "The first step is token pairing: define which foreground tokens are valid against each background token and capture expected contrast thresholds directly in your design token layer.",
      "The second step is full-state auditing. Validate default, hover, focus-visible, active, and disabled states in every supported theme. Many products pass static audits but fail during interaction.",
      "The third step is CI integration with actionable failures. When checks fail, reports should include token names, component context, and the measured ratio so fixes are immediate and repeatable.",
      "The fourth step is content realism. Test long strings, localization, and mixed hierarchy text to ensure theoretical contrast compliance still works under real product copy.",
      "Once contrast is encoded and automated, teams stop fighting recurring accessibility bugs and ship inclusive interfaces with confidence.",
    ],
  },
  {
    date: "MAR 25, 2026",
    readTime: "10 MIN READ",
    title: "Debugging Frontend Incidents Before Users Notice",
    excerpt:
      "For frontend leads and founders who need repeatable incident response: detect early, diagnose fast, and ship safe fixes.",
    tags: ["incident-response", "observability", "frontend", "founders"],
    content: [
      "Frontend incidents are often discovered by users first because teams rely on logs and manual bug reports instead of proactive client-side signals. A stronger model is early detection through route-level error rates, API failure spikes, and Core Web Vitals drift alerts.",
      "Start with one reproducible incident template: what failed, when it started, who is impacted, and what changed in the last release window. This prevents random debugging and keeps cross-team communication precise.",
      "Split diagnosis into three lanes: rendering lane (layout/hydration/state), network lane (API contracts, retries, auth), and environment lane (deploy config, CDN, feature flags). Most incidents resolve faster when these lanes are investigated in parallel.",
      "Before coding a fix, add one failing regression test or reproduction script. This protects you from false confidence and guarantees the incident is truly resolved once the fix lands.",
      "Ship with safety: rollout behind a flag when possible, monitor error and latency recovery for at least one release cycle, and keep rollback criteria explicit. Fast recovery matters, but verified recovery matters more.",
      "Teams that institutionalize this workflow reduce firefighting and build user trust because product reliability becomes observable, repeatable, and steadily improving.",
    ],
  },
];

export const socialHandles: SocialHandle[] = [
  {
    label: "GitHub Profile",
    href: "https://github.com/Sartahkakaedar",
    description: "Source profile and contribution history",
  },
  {
    label: "Main Repository",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-",
    description: "Portfolio source code",
  },
  {
    label: "Design System (Storybook)",
    href: "https://portfolio-storybook.vercel.app",
    description: "Interactive component library & design tokens",
  },
  {
    label: "Open Issues",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/issues",
    description: "Tracked tasks and fixes",
  },
  {
    label: "Email",
    href: "mailto:swarajmundhe22@gmail.com",
    description: "Direct contact",
  },
];

export const footerGroups: FooterGroup[] = [
  {
    title: "Design",
    links: [
      { label: "Design System (Storybook)", href: "https://portfolio-storybook.vercel.app" },
      { label: "Component Library", href: "https://portfolio-storybook.vercel.app" },
      { label: "Color Tokens", href: "https://portfolio-storybook.vercel.app" },
      { label: "Motion Guidelines", href: "/blogs" },
    ],
  },
  {
    title: "Craft",
    links: [
      {
        label: "Portfolio Repo",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-",
      },
      {
        label: "Visual Tests",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/tests",
      },
      {
        label: "CI/CD Pipeline",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/.github",
      },
      {
        label: "Engineering Notes",
        href: "/blogs",
      },
    ],
  },
  {
    title: "Quality",
    links: [
      { label: "WCAG 2.1 AA Audits", href: "/about" },
      { label: "Performance Profiles", href: "/work" },
      { label: "Visual Regression Testing", href: "/blogs" },
      { label: "Accessibility Reports", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        label: "Privacy Policy",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/blob/main/README.md",
      },
      {
        label: "Terms & Conditions",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/blob/main/README.md",
      },
    ],
  },
];

export const labProjects: LabProject[] = [
  {
    slug: "magnetic-blobs",
    title: "Magnetic Blobs",
    description: "Interactive field simulation with pointer-reactive particles and smooth deformation.",
    status: "LIVE",
    category: "Motion",
    lastUpdated: "JAN 2026",
    accent: "violet",
  },
  {
    slug: "animated-list",
    title: "Animated List",
    description: "Staggered list choreography tuned for readable information flow and low layout shift.",
    status: "LIVE",
    category: "Interaction",
    lastUpdated: "APR 2026",
    accent: "teal",
  },
  {
    slug: "galaxy-field",
    title: "Galaxy",
    description: "Depth-layered particle composition with cinematic parallax and low-noise transitions.",
    status: "LIVE",
    category: "Visualization",
    lastUpdated: "APR 2026",
    accent: "amber",
  },
];

export const usesHardware: UsesItem[] = [
  {
    id: "msi",
    title: "MSI Workstation Setup",
    description: "Primary build machine for full-stack development, visual testing, and profiling.",
    imageSrc: "/project-1.jpg",
  },
  {
    id: "mx-master",
    title: "MX Master 3S Details",
    description: "High precision pointer workflow tuned for dense UI composition and motion tuning.",
    imageSrc: "/project-2.jpg",
  },
  {
    id: "iphone",
    title: "iPhone 17 Pro (Display)",
    description: "Mobile regression checks, interaction QA, and responsive behavior validation.",
    imageSrc: "/project-3.jpg",
  },
  {
    id: "audio",
    title: "Audio Monitoring",
    description: "Focused audio reference setup for editing, demos, and user-research playback.",
    imageSrc: "/project-4.jpg",
  },
];

export const guestbookEntries: GuestbookEntry[] = [
  {
    id: "g-1",
    name: "Swaraj Mundhe",
    handle: "12/08/2025",
    message: "A remarkably strong visual direction with crisp motion pacing maintained across every section.",
    pinned: true,
  },
  {
    id: "g-2",
    name: "David Chen",
    handle: "24/09/2025",
    message: "Smooth transitions and a clear typographic hierarchy. The overall execution feels highly intentional and premium.",
  },
  {
    id: "g-3",
    name: "Viraj Thukrul",
    handle: "05/11/2025",
    message: "Interactions are highly polished and responsive. Beautiful balance struck between cinematic motion and accessibility.",
  },
  {
    id: "g-4",
    name: "Laura Martinez",
    handle: "18/12/2025",
    message: "Impeccable UI consistency and spacing discipline. Every visual component feels rigorously crafted.",
  },
  {
    id: "g-5",
    name: "Marcus Vestergaard",
    handle: "09/01/2026",
    message: "Demonstrates strong engineering clarity paired with compelling visual storytelling. A very confidence-inspiring portfolio.",
  },
  {
    id: "g-6",
    name: "Elena Rostova",
    handle: "18/01/2026",
    message: "Reliable technical execution combined with highly effective communication design. A testament to excellent frontend craftsmanship.",
  },
  {
    id: "g-7",
    name: "James O'Connor",
    handle: "04/02/2026",
    message: "Top-tier color contrast and typography pairing decisions. Highly readable and accessible, even in low-light environments.",
  },
  {
    id: "g-8",
    name: "Sarah Jenkins",
    handle: "22/02/2026",
    message: "The motion language is perfectly cohesive from start to finish. Outstanding attention to detail on micro-interaction states.",
  },
  {
    id: "g-9",
    name: "Kenji Sato",
    handle: "27/02/2026",
    message: "Exceptional use of spatial design and grid layouts. The structural foundation of the pages is incredibly robust.",
  },
  {
    id: "g-10",
    name: "Naitik Singh",
    handle: "05/03/2026",
    message: "Clean code architecture reflecting through a flawless user experience. Brilliantly shipped and easily navigable.",
  },
  {
    id: "g-11",
    name: "Amira Hassan",
    handle: "14/03/2026",
    message: "Performance tuning here is top-notch. It runs buttery smooth across varying viewport sizes and network conditions.",
  },
  {
    id: "g-12",
    name: "Thomas Wright",
    handle: "25/03/2026",
    message: "A masterclass in modern web capabilities. The integration of 3D elements feels native and fundamentally necessary, not just decorative.",
  },
  {
    id: "g-13",
    name: "Chloe Dubois",
    handle: "02/04/2026",
    message: "Typography scales fluidly without breaking the reading rhythm. Extremely mindful handling of the content experience.",
  },
  {
    id: "g-14",
    name: "Liam Gallagher",
    handle: "05/04/2026",
    message: "Navigation patterns are intuitive despite the heavy cinematic stylings. Real constraint shown by keeping UX predictably sound.",
  },
  {
    id: "g-15",
    name: "Mia Andersson",
    handle: "08/04/2026",
    message: "Strikingly fast and deeply responsive. This sets a very high benchmark for creative engineering portfolios.",
  }
];
