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
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export interface BlogPost {
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  tags: string[];
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
  locationShort: "Pune, IN",
  roleShort: "Founder / Full-stack Engineer",
  roleLong: "Product engineering, design systems, and release automation",
  availability: "Available for product consulting",
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

export const stackTags: string[] = [
  "React 19",
  "TypeScript",
  "Vite 7",
  "Framer Motion",
  "Playwright",
  "Supabase",
  "Node.js",
  "Serverless APIs",
  "GitHub Actions",
  "Vercel",
  "PostgreSQL",
  "Design Systems",
  "Accessibility",
  "Performance",
  "Git",
  "CI/CD",
];

export const timelineEntries: TimelineEntry[] = [
  {
    period: "APR 2026 - CURRENT",
    title: "Founder & Product Engineer",
    org: "On-Lookers",
    bullets: [
      "Founded The On Lookers Project: Silent Decay, a predictive-infrastructure-intelligence platform that forecasts corrosion and material degradation before failure using production-grade risk models.",
      "Integrated environmental exposure modeling, electrochemical analysis, and digital simulations into a unified computational core with proactive 3-D visualization and an automated recommendation engine.",
      "Drove measurable impact across pipelines, bridges, marine vessels, and industrial plants: accelerated maintenance planning by 42%, reduced unplanned failure risk by 31%, and validated modeled ROI up to 2.4x in pilot evaluations.",
    ],
    tags: ["React", "TypeScript", "Playwright", "Framer Motion"],
  },
  {
    period: "JAN 2026 - MAR 2026",
    title: "Frontend & Automation Engineer",
    org: "Independent Projects",
    bullets: [
      "Shipped serverless contact and profile endpoints integrated with Supabase.",
      "Built release automation workflows to prevent design drift on pull requests.",
      "Validated accessibility and responsive behavior for production delivery targets.",
    ],
    tags: ["Supabase", "API Routes", "GitHub Actions", "WCAG"],
  },
  {
    period: "2025",
    title: "Open Source Contributor",
    org: "GitHub",
    bullets: [
      "Contributed UI refinements and bug fixes to JavaScript and TypeScript repositories.",
      "Documented reproducible workflows for testing, builds, and deployment checks.",
      "Focused on maintainability upgrades and practical developer-experience improvements.",
    ],
    tags: ["Open Source", "JavaScript", "TypeScript", "DX"],
  },
];

export const workItems: WorkItem[] = [
  {
    title: "On-Lookers Founder Portfolio",
    category: "Flagship Web Experience",
    description:
      "A recording-matched personal portfolio with cinematic typography, modular sections, and interactive storytelling.",
    accent: "red",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-",
    stack: ["React", "TypeScript", "Framer Motion", "Vite"],
    outcome: "Production build validated and deployed via Vercel-ready configuration.",
  },
  {
    title: "Serverless Contact Workflow",
    category: "API / Supabase Integration",
    description:
      "Secure contact ingestion endpoints with structured payload validation and database persistence.",
    accent: "blue",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/api",
    stack: ["Node.js", "Supabase", "Vercel Functions"],
    outcome: "Reliable lead capture path with clean API boundaries.",
  },
  {
    title: "Profile & Project Data Endpoints",
    category: "Structured Content Delivery",
    description:
      "Composable API surfaces that expose profile and project metadata for future frontend extensions.",
    accent: "amber",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/api",
    stack: ["JavaScript", "Serverless", "JSON Contracts"],
    outcome: "Consistent data contracts for scalable content iteration.",
  },
  {
    title: "Visual Regression Gate",
    category: "Quality Engineering",
    description:
      "Cross-browser screenshot comparisons with strict thresholding to block unreviewed visual drift.",
    accent: "red",
    href: "https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/tree/main/tests",
    stack: ["Playwright", "GitHub Actions", "Snapshot Diffing"],
    outcome: "Automated confidence before merge and deployment.",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Playwright CI",
    role: "Visual Baseline Guardian",
    quote:
      "Cross-browser snapshots now cover hero, profile, project gallery, nav states, modal overlays, and loading skeletons.",
  },
  {
    name: "TypeScript Compiler",
    role: "Build Gate",
    quote:
      "All frontend changes are type-checked and production-built before visual baselines are updated.",
  },
  {
    name: "Frame Analysis Pipeline",
    role: "Reference Recording Audit",
    quote:
      "97 sampled recording frames and palette distributions are preserved for measurable visual verification.",
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
  },
  {
    date: "APR 04, 2026",
    readTime: "7 MIN READ",
    title: "Design Drift Is a CI Problem, Not a QA Problem",
    excerpt:
      "A practical guide for introducing strict screenshot comparisons that fail pull requests on visual regressions.",
    tags: ["playwright", "ci", "visual-testing"],
  },
  {
    date: "APR 03, 2026",
    readTime: "8 MIN READ",
    title: "Building Reliable Contact Pipelines With Supabase",
    excerpt:
      "Lessons from wiring serverless forms, validation boundaries, and predictable data contracts.",
    tags: ["supabase", "api", "forms"],
  },
  {
    date: "APR 01, 2026",
    readTime: "6 MIN READ",
    title: "Motion Values That Feel Premium at 60 FPS",
    excerpt:
      "Why easing curves and short durations matter more than flashy effects in production product interfaces.",
    tags: ["motion", "performance", "design-system"],
  },
  {
    date: "MAR 30, 2026",
    readTime: "8 MIN READ",
    title: "Responsive QA Checklist for 320 to 1440 Widths",
    excerpt:
      "A reproducible viewport strategy for shipping consistent layouts across phones, tablets, and desktops.",
    tags: ["responsive", "qa", "css"],
  },
  {
    date: "MAR 28, 2026",
    readTime: "7 MIN READ",
    title: "Accessibility Contrast Audits Without Guesswork",
    excerpt:
      "How tokenized color systems make WCAG 2.1 AA verification deterministic and automatable.",
    tags: ["accessibility", "wcag", "design-tokens"],
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
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Blogs", href: "#blogs" },
      { label: "Contact", href: "#contact" },
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
      { label: "WCAG 2.1 AA", href: "#more" },
      { label: "Cross-browser QA", href: "#work" },
      { label: "Visual Diff Review", href: "#blogs" },
      { label: "CI Gates", href: "#contact" },
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
