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
  roleShort: "Creative Developer",
  roleLong: "Product engineering, design systems, and release automation",
  availability: "Available for product consulting",
  founderLabel: "ARVYA",
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
    title: "The On Lookers Project: Silent Decay",
    category: "Founder Spotlight / Predictive Infrastructure Intelligence",
    description:
      "A pioneering startup initiative focused on forecasting corrosion and material degradation long before physical failure occurs.",
    accent: "blue",
    href: "https://github.com/Sartahkakaedar/The-On-Lookers",
    stack: [
      "Predictive Infrastructure Intelligence",
      "Environmental Modeling",
      "Electrochemical Analysis",
      "3D Risk Visualization",
    ],
    outcome:
      "Shifts infrastructure management from reactive inspection to predictive intelligence, reducing repair costs and improving safety outcomes.",
    context: `The On Lookers Project: Silent Decay is a pioneering startup initiative dedicated to predictive infrastructure intelligence. At its core, the platform is designed to forecast corrosion and material degradation long before physical failure occurs, transforming how industries approach infrastructure safety and maintenance.

The system integrates multiple scientific and computational disciplines into a unified digital framework. Environmental modeling captures the impact of humidity, salinity, temperature, and pollution on materials. Electrochemical analysis applies principles such as Faraday's Law and the Nernst Equation to simulate corrosion reactions with precision. Digital simulations then project how degradation will progress over time, enabling engineers to visualize risks in three dimensions. This combination of chemistry, material science, and advanced computation creates a proactive intelligence engine that goes far beyond traditional inspection methods.

Unlike conventional monitoring, which detects damage only after it begins, Silent Decay empowers organizations to anticipate risks in advance. Engineers can estimate structural lifespan, identify high-risk environments, and receive automated recommendations for preventive strategies such as protective coatings, cathodic protection, or material upgrades. The platform's 3D visualization engine animates corrosion spread and structural weakening, making complex scientific processes intuitive and actionable.

The measurable impact is significant: pipelines can avoid costly leaks, bridges can extend their service life, marine vessels can reduce maintenance downtime, and industrial plants can prevent shutdowns. By shifting from reactive inspection to predictive intelligence, Silent Decay reduces repair costs, enhances safety, and supports sustainable infrastructure management.

This startup represents a new paradigm in engineering intelligence - a system that not only analyzes but also advises, visualizes, and prevents. Silent Decay positions itself as a global solution for industries seeking to protect critical assets, safeguard communities, and optimize infrastructure investments with foresight and precision.`,
    imageSrc: "/work/silent-decay-founder.png",
    imageAlt: "Silent Decay founder project screenshot",
  },
];

export const openSourceReviews: OpenSourceReview[] = [
  {
    id: "os-1",
    userName: "DevNexus-47",
    handle: "@devnexus47",
    project: "react-router-labs",
    review: `ReactJS + NextJS + TypeScript integration was super clean across route modules and shared UI blocks.
Type contracts stayed strict even after splitting features into multiple pages and reusable components.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=devnexus47",
    stars: 5,
  },
  {
    id: "os-2",
    userName: "UIFluxNode",
    handle: "@uifluxnode",
    project: "tailwind-motion-kit",
    review: `Tailwind CSS utility structure was consistent and Motion transitions felt premium without hurting responsiveness.
The animation timing looked polished while still respecting reduced-motion behavior and interaction clarity.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=uifluxnode",
    stars: 5,
  },
  {
    id: "os-3",
    userName: "ContentOrbit",
    handle: "@contentorbit",
    project: "cms-bridge-core",
    review: `Sanity and Contentful modeling was thoughtfully mapped, with clear schema boundaries and predictable payload shape.
Editorial workflows now sync faster and content retrieval feels much more reliable in production runs.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=contentorbit",
    stars: 5,
  },
  {
    id: "os-4",
    userName: "RuntimeForge",
    handle: "@runtimeforge",
    project: "service-mesh-node",
    review: `NodeJS + ExpressJS APIs were structured cleanly, and PostgreSQL/MongoDB data paths stayed easy to follow.
Prisma usage improved query readability while keeping migrations and data consistency stable across environments.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=runtimeforge",
    stars: 5,
  },
  {
    id: "os-5",
    userName: "StatePilot",
    handle: "@statepilot",
    project: "zustand-zod-stack",
    review: `Zustand state slices are now well-scoped, and Zod validation catches bad inputs before they leak downstream.
The form and API boundaries feel safer, with better runtime guarantees and much clearer error surfaces.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=statepilot",
    stars: 5,
  },
  {
    id: "os-6",
    userName: "BuildRunnerX",
    handle: "@buildrunnerx",
    project: "toolchain-perf-kit",
    review: `pnpm + Bun setup is fast and practical, and Git workflow hygiene makes collaboration much smoother.
Dependency installation, script execution, and commit flow all improved without adding unnecessary complexity.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=buildrunnerx",
    stars: 5,
  },
  {
    id: "os-7",
    userName: "RepoPulse",
    handle: "@repopulse",
    project: "release-orchestration",
    review: `GitHub review flow is much cleaner now, and Vercel deployment previews are tied neatly into PR validation.
Release confidence improved because code review, preview links, and merge decisions happen in one clear loop.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=repopulse",
    stars: 5,
  },
  {
    id: "os-8",
    userName: "CloudHexa",
    handle: "@cloudhexa",
    project: "infra-mobile-ops",
    review: `AWS + Docker foundations were configured well, and Expo + Clerk integration handled auth and app flow smoothly.
Linux-targeted setup notes are practical, making local-to-cloud environments more consistent for teams.`,
    avatarUrl: "https://api.dicebear.com/9.x/identicon/svg?seed=cloudhexa",
    stars: 5,
  },
];

export const blogPosts: BlogPost[] = [
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
    title: "General",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Blogs", href: "/blogs" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Work",
    links: [
      {
        label: "Portfolio Repo",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-",
      },
      {
        label: "API Routes",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/api",
      },
      {
        label: "Visual Tests",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/tests",
      },
      {
        label: "Analysis",
        href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/analysis",
      },
    ],
  },
  {
    title: "Quality",
    links: [
      { label: "WCAG 2.1 AA", href: "/more" },
      { label: "Cross-browser QA", href: "/work" },
      { label: "Visual Diff Review", href: "/blogs" },
      { label: "CI Gates", href: "/contact" },
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
