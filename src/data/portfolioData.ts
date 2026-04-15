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
    readTime: "12 MIN READ",
    title: "Why React + Three.js + Real-time Simulation for Infrastructure Intelligence",
    excerpt:
      "Building computational accuracy and visual immediacy for predictive infrastructure forecasting. The tech stack decisions behind Silent Decay.",
    tags: ["silent-decay", "architecture", "react", "three.js"],
    content: [
      "Silent Decay forecasts infrastructure deterioration months in advance by running continuous electrochemical simulations. The interface must render complex spatial data while maintaining scientific precision and user clarity. This meant choosing technologies that excel at different layers: React for state coherence, Three.js for 3D spatial reasoning, and a custom Node simulation engine for the computational core.",
      "React was the inevitable choice for the dashboard layer. It forces unidirectional state flow, which becomes critical when sensor data streams in at 1000+ events/second and the UI must reflect forecasts that update every minute. Context + custom hooks let us isolate simulation state from UI state, preventing expensive re-renders when probabilities shift slightly. TypeScript sealed the contract between data shapes—an electrochemical analysis output must match the props expected by the visualization component, or the build fails.",
      "Three.js handles the 3D visualization burden. Engineers need to understand where corrosion will spread and how fast. A flat dashboard would require them to context-switch between tables and mental models. Instead, they see degradation progress as a tangible 3D timeline: darker reds indicate imminent failure, lighter shades indicate years of remaining lifespan. Three.js lets us render 10,000+ point clouds at 60fps and update them in real-time. The performance imperative forced architectural rigor—we profile constantly, use GPU instancing, and keep computational work off the render thread.",
      "The simulation engine lives in Node. PostgreSQL stores historical sensor readings and calibration data. A background service continuously re-runs electrochemical models (Faraday's Law, Nernst equations) against current conditions. Results flow to React via real-time Supabase subscriptions, causing the 3D visualization to update without polling. This architecture keeps UI concerns (React, motion, interaction) separate from computational concerns (simulation accuracy, numerical stability).",
      "The deeper lesson: technology choices aren't about what's trendy. They're about what problems you're solving. We chose React because state management scales with feature complexity. We chose Three.js because spatial reasoning is core to the product—users need intuition about 3D risk. We chose Node for simulation because numerical accuracy matters more than UI responsiveness there. When each technology serves a clear purpose, the architecture becomes coherent instead of chaotic.",
    ],
  },
  {
    date: "APR 05, 2026",
    readTime: "9 MIN READ",
    title: "Frame-Matching a Portfolio From Video Only",
    excerpt:
      "How we extracted motion, spacing, and color intent from a 97-second recording and translated it into maintainable code.",
    tags: ["reverse-engineering", "frontend", "ux"],
    content: [
      "Most recreations fail because they copy what the interface looks like, but ignore what it feels like over time. The reference recording had aggressive headline scale, delayed reveals, and a strict rhythm between static text and animated surfaces. So we started by treating each frame as a timing contract, not only as a visual reference.",
      "The second pass focused on measurement. We extracted recurring spacing intervals, heading baselines, and card edge alignments from multiple timestamps to avoid overfitting to a single frame. That gave us a resilient spacing system which still behaves correctly once content changes or screen width shifts.",
      "Animation matching required motion profiling. We tracked ease curves, overshoot, and dwell time to preserve the cinematic feel while keeping interactions responsive. Long transitions were reserved for section reveals; interactive controls stayed short to maintain perceived snappiness.",
      "Finally, we translated everything into reusable primitives: section titles, card shells, route-level transitions, and state-safe controls. The result is not a brittle clone, but a production-ready interface that keeps the visual language of the recording while remaining maintainable under real product iteration.",
    ],
  },
  {
    date: "APR 04, 2026",
    readTime: "7 MIN READ",
    title: "Design Drift Is a CI Problem, Not a QA Problem",
    excerpt:
      "A practical guide for introducing strict screenshot comparisons that fail pull requests on visual regressions.",
    tags: ["playwright", "ci", "visual-testing"],
    content: [
      "Teams often discover visual regressions too late because screenshots are treated as optional QA evidence. In reality, visual integrity belongs inside CI. If a layout, spacing rhythm, or contrast ratio changes unexpectedly, the pull request should fail before merge.",
      "The key is stable baseline generation. We run deterministic snapshots across viewport tiers, disable noisy effects in visual-regression mode, and keep fixed timestamps for dynamic widgets. This transforms flaky image comparisons into reliable release gates.",
      "Diff review must be actionable, not noisy. We prioritize high-signal artifacts: full-page snapshots, threshold summaries, and a compact list of changed zones. Reviewers can quickly decide whether the visual delta is intended or a regression.",
      "When visual checks are enforced the same way unit tests are enforced, design drift stops being a late-stage surprise. It becomes a first-class engineering constraint, which improves both consistency and speed of delivery.",
    ],
  },
  {
    date: "APR 03, 2026",
    readTime: "8 MIN READ",
    title: "Building Reliable Contact Pipelines With Supabase",
    excerpt:
      "Lessons from wiring serverless forms, validation boundaries, and predictable data contracts.",
    tags: ["supabase", "api", "forms"],
    content: [
      "Contact flows look simple until malformed payloads, bot traffic, and schema drift start accumulating. A reliable pipeline starts with strict input contracts. Every field is validated both client-side for UX and server-side for integrity before any insert happens.",
      "Serverless endpoints should return explicit, typed error states. Generic failures make troubleshooting difficult for users and for operators. We map each validation and persistence error to predictable response shapes so the UI can show exact remediation steps.",
      "Supabase integration works best when table schemas and API payloads evolve together. We version request fields carefully, avoid silent coercion, and keep migration scripts in lockstep with frontend form changes.",
      "The outcome is a submission flow that remains stable under real traffic, is debuggable during incidents, and is safe to extend as product requirements expand.",
    ],
  },
  {
    date: "APR 01, 2026",
    readTime: "6 MIN READ",
    title: "Motion Values That Feel Premium at 60 FPS",
    excerpt:
      "Why easing curves and short durations matter more than flashy effects in production product interfaces.",
    tags: ["motion", "performance", "design-system"],
    content: [
      "Premium motion is mostly restraint. Interfaces feel expensive when movement reinforces hierarchy and intent, not when every element animates. We reserve large transitions for section-level context shifts and keep component interactions tight.",
      "Performance and motion design are tightly coupled. Any easing curve that feels good at 60 FPS can feel sluggish at lower frame rates, so we profile on real hardware and budget animation complexity per view.",
      "A consistent timing scale helps teams avoid random values. Fast interactions stay in the 160-240ms range, medium reveals around 320-520ms, and long cinematic transitions are used sparingly for hero moments.",
      "With this system, motion becomes a design primitive that improves comprehension and polish without threatening responsiveness or battery usage.",
    ],
  },
  {
    date: "MAR 30, 2026",
    readTime: "8 MIN READ",
    title: "Responsive QA Checklist for 320 to 1440 Widths",
    excerpt:
      "A reproducible viewport strategy for shipping consistent layouts across phones, tablets, and desktops.",
    tags: ["responsive", "qa", "css"],
    content: [
      "Responsive bugs rarely come from one breakpoint. They emerge in transition ranges where typography, spacing, and component density shift together. Our checklist tests representative widths and transition widths, not only canonical device sizes.",
      "We validate layout in three passes: structural integrity, interaction ergonomics, and visual rhythm. Structural checks catch overflow and clipping, ergonomics verify touch targets and focus order, and rhythm checks ensure spacing still reads intentional.",
      "Automated snapshots cover broad regression detection, but manual sweeps still matter for scroll feel and sticky navigation behavior. We pair both to catch issues that pixel diffs alone cannot classify.",
      "The process reduces launch-day surprises and keeps components composable across product areas, which is critical when design systems are shared by multiple teams.",
    ],
  },
  {
    date: "MAR 28, 2026",
    readTime: "7 MIN READ",
    title: "Accessibility Contrast Audits Without Guesswork",
    excerpt:
      "How tokenized color systems make WCAG 2.1 AA verification deterministic and automatable.",
    tags: ["accessibility", "wcag", "design-tokens"],
    content: [
      "Contrast quality should never depend on subjective judgment. We define color tokens with known luminance relationships and validate combinations programmatically against WCAG thresholds before they reach production.",
      "State variants require explicit checks too. Hover, focus, active, and disabled states often drift away from compliant baselines. Automated token audits ensure every state remains legible under both default and enhanced visibility modes.",
      "Accessibility validation is strongest when integrated into CI. If a token update reduces contrast below policy, the pipeline fails immediately and points to the exact pair that violated the rule.",
      "By codifying contrast decisions in tokens and tests, teams move from reactive fixes to predictable, repeatable accessibility quality across the entire UI surface.",
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
