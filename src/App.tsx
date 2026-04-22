import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Command,
  ExternalLink,
  Github,
  Globe2,
  Instagram,
  Linkedin,
  LocateFixed,
  Mail,
  Menu,
  MessageCircle,
  MoonStar,
  Send,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  footerGroups,
  guestbookEntries,
  labProjects,
  navLinks,
  openSourceReviews,
  profileIdentity,
  socialHandles,
  timelineEntries,
  usesHardware,
  workItems,
} from './data/portfolioData';
import { useGitHubContributions } from './hooks/useGitHubContributions';
import {
  githubHeatMapCells,
  githubHeatMapContributionTotal,
  githubHeatMapMonthLabels,
  githubHeatMapRange,
  githubHeatMapWeeks,
  type GitHubHeatMapCell,
  type GitHubHeatMapMonthLabel,
} from './data/githubHeatmapData';
import BlogArticlePage from './components/BlogArticlePage';
import CinematicImage from './components/CinematicImage';
import SkillsetDisplay from './components/SkillsetDisplay';
import AnimatedCursor from './components/AnimatedCursor';
import LabErrorBoundary from './components/labs/LabErrorBoundary';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import MagneticBlobsLab from './labs/magnetic/MagneticBlobsLab';
import AnimatedListLab from './labs/animated-list/AnimatedListLab';
import GalaxyFieldLab from './labs/galaxy/GalaxyFieldLab';
import './App.css';
import './work-cards-premium.css';
import './voices-cards-premium.css';
import './labs/labs.css';

const loadCubeWidget = () => import('./components/CubeWidget.tsx');
const loadGlobeWidget = () => import('./components/GlobeWidget.tsx');
const loadTimezoneClockWidget = () => import('./components/TimezoneClockWidget.tsx');
const loadDynamicBlogCards = () => import('./components/DynamicBlogCards.tsx');
const loadBookingScheduler = () => import('./components/BookingScheduler.tsx');

const CubeWidget = lazy(loadCubeWidget);
const GlobeWidget = lazy(loadGlobeWidget);
const TimezoneClockWidget = lazy(loadTimezoneClockWidget);
const DynamicBlogCards = lazy(loadDynamicBlogCards);
const BookingScheduler = lazy(loadBookingScheduler);

gsap.registerPlugin(ScrollTrigger);

interface SectionTitleProps {
  sectionId: string;
  navSection?: string;
  eyebrow: string;
  title: string;
  script: string;
}

interface RuntimeFlags {
  visualRegressionMode: boolean;
  forceSkeleton: boolean;
  forceModal: boolean;
  forceValidation: boolean;
  forceNavExpanded: boolean;
  forceMobileNav: boolean;
  forceButtonStates: boolean;
}

type BrightnessMode = 'enterprise' | 'enhanced-visibility';

type CinematicTheme = 'default' | 'about' | 'work' | 'blogs' | 'labs' | 'contact';

interface BrightnessModeMeta {
  label: string;
  uiBrightnessRange: [number, number];
  cubeExposureRange: [number, number];
}

interface HomePageProps {
  runtimeFlags: RuntimeFlags;
  brightnessMode: BrightnessMode;
  linkedinHref: string;
  githubProfileHref: string;
  instagramHref: string;
  emailHref: string;
  goToContactPage: () => void;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  heroLeadY: MotionValue<number>;
  heroLeadOpacity: MotionValue<number>;
}

interface AboutPageProps {
  runtimeFlags: RuntimeFlags;
  contributionTotal: number;
  heatMapWeeks: number;
  heatMapMonthLabels: readonly GitHubHeatMapMonthLabel[];
  heatMapCells: readonly GitHubHeatMapCell[];
}

interface WorkPageProps {
  runtimeFlags: RuntimeFlags;
  contentReady: boolean;
  skeletonCards: number[];
}

interface BlogsPageProps {
  runtimeFlags: RuntimeFlags;
  contentReady: boolean;
  blogsShouldLoad: boolean;
  skeletonBlogs: number[];
}

interface ContactPageProps {
  runtimeFlags: RuntimeFlags;
  shouldRenderBookingScheduler: boolean;
  openContactModal: () => void;
}

interface CinematicThemeSpec {
  rgb: [number, number, number];
  hueShift: number;
  saturation: number;
  lift: number;
}

const titleTransition = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

const cinematicEase = [0.16, 1, 0.3, 1] as [number, number, number, number];
const cardRevealTransition = {
  duration: 0.76,
  ease: cinematicEase,
};
const timelineEntryMotionVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.985,
    filter: 'blur(6px)',
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.58,
      delay: Math.min(index * 0.08, 0.24),
      ease: cinematicEase,
    },
  }),
};

const brightnessModeStorageKey = 'agon.brightness-mode';

const cinematicThemeSpecs: Record<CinematicTheme, CinematicThemeSpec> = {
  default: {
    rgb: [208, 217, 255],
    hueShift: 0,
    saturation: 1,
    lift: 1,
  },
  about: {
    rgb: [198, 244, 227],
    hueShift: -6,
    saturation: 1.04,
    lift: 1.01,
  },
  work: {
    rgb: [255, 201, 226],
    hueShift: 8,
    saturation: 1.08,
    lift: 1.02,
  },
  blogs: {
    rgb: [255, 222, 190],
    hueShift: 14,
    saturation: 1.05,
    lift: 1.015,
  },
  labs: {
    rgb: [193, 220, 255],
    hueShift: -12,
    saturation: 1.1,
    lift: 1.02,
  },
  contact: {
    rgb: [223, 246, 208],
    hueShift: -3,
    saturation: 1.03,
    lift: 1.01,
  },
};

const cinematicThemeSelectors: Array<{ selector: string; theme: CinematicTheme }> = [
  { selector: '.hero-section, .interface-grid', theme: 'default' },
  { selector: '.about-section, .timeline-card, .heatmap-section', theme: 'about' },
  { selector: '.works-section, .voices-section, .work-card', theme: 'work' },
  { selector: '.blogs-section, .blog-card', theme: 'blogs' },
  { selector: '.presence-section, .labs-route-page, .uses-route-page, .guestbook-route-page', theme: 'labs' },
  { selector: '.book-call-section, .site-footer, .contact-modal', theme: 'contact' },
];

const cinematicDepthSelectors: Array<{ selector: string; depth: number }> = [
  { selector: '.profile-surface, .contact-surface, .founder-surface', depth: 0.44 },
  { selector: '.focus-surface, .globe-surface, .clock-surface, .timeline-item', depth: 0.34 },
  { selector: '.work-card, .blog-card, .voice-float-card, .presence-row', depth: 0.28 },
  { selector: '.section-title-content, .logic-band, .footer-cta', depth: 0.18 },
];

const cinematicSoundHookSelectors: Array<{ selector: string; hook: string }> = [
  { selector: '.primary-action, .book-call-pill, .contact-surface button', hook: 'cta-primary' },
  { selector: '.ghost-action, .secondary-action, .nav-link', hook: 'cta-secondary' },
  { selector: '.modal-close, .mobile-nav-toggle', hook: 'system-toggle' },
];

const navSectionToTheme = (navSection?: string): CinematicTheme => {
  switch (navSection) {
    case 'about':
      return 'about';
    case 'work':
      return 'work';
    case 'blogs':
      return 'blogs';
    case 'more':
      return 'labs';
    case 'contact':
      return 'contact';
    default:
      return 'default';
  }
};

const brightnessModeMeta: Record<BrightnessMode, BrightnessModeMeta> = {
  enterprise: {
    label: 'Enterprise',
    uiBrightnessRange: [0.98, 1.03],
    cubeExposureRange: [1.0, 1.08],
  },
  'enhanced-visibility': {
    label: 'Enhanced Visibility',
    uiBrightnessRange: [1.06, 1.14],
    cubeExposureRange: [1.12, 1.22],
  },
};

const normalizeBrightnessMode = (value: string | null): BrightnessMode =>
  value === 'enhanced-visibility' ? 'enhanced-visibility' : 'enterprise';

const getInitialBrightnessMode = (): BrightnessMode => {
  if (typeof window === 'undefined') {
    return 'enterprise';
  }

  const search = new URLSearchParams(window.location.search);

  if (search.get('vr') === '1') {
    return 'enterprise';
  }

  const modeFromQuery = search.get('brightness');
  if (modeFromQuery) {
    return normalizeBrightnessMode(
      modeFromQuery === 'enhanced' ? 'enhanced-visibility' : modeFromQuery,
    );
  }

  const modeFromStorage = window.localStorage.getItem(brightnessModeStorageKey);
  return normalizeBrightnessMode(modeFromStorage);
};

const WidgetFallback = ({ className }: { className?: string }) => (
  <div className={`widget-loading-placeholder ${className ?? ''}`.trim()} aria-hidden="true" />
);

const SectionTitle = ({ sectionId, navSection, eyebrow, title, script }: SectionTitleProps) => (
  <section
    id={sectionId}
    data-section={navSection}
    data-color-theme={navSectionToTheme(navSection)}
    data-cinematic-hook="section-title"
    className="section-title-block"
  >
    <motion.div
      initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.5 }}
      transition={titleTransition}
      className="section-title-content"
      data-cinematic-text="stagger-lines"
    >
      <motion.p
        className="section-eyebrow"
        data-cinematic-line="eyebrow"
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ ...titleTransition, delay: 0 }}
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        className="section-title-main"
        data-cinematic-line="title"
        initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ ...titleTransition, delay: 0.12 }}
      >
        {title}
      </motion.h2>
      <motion.p
        className="section-title-script"
        data-cinematic-line="script"
        initial={{ opacity: 0, y: 20, filter: 'blur(7px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ ...titleTransition, delay: 0.24 }}
      >
        {script}
      </motion.p>
    </motion.div>
  </section>
);

const clampPercent = (value: number): number => Math.min(1, Math.max(0, value));

const heatMapPalette = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'] as const;
const heatMapIntensityLabels = [
  'No visible activity',
  'Light output',
  'Steady rhythm',
  'High velocity',
  'Peak sprint',
] as const;
const heatMapDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const formatHeatMapDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return heatMapDateFormatter.format(utcDate);
};

const formatHeatMapLastUpdatedDate = (date: string): string => {
  const [year = '', month = '', day = ''] = date.split('-');
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

const defaultHeatMapPinnedDate = '2026-04-12';
const heatMapContributionFloor = 1229;
const heatMapLastUpdatedLabel = `Last updated ${formatHeatMapLastUpdatedDate(githubHeatMapRange.end)}`;
const timelineThemeClass = 'timeline-theme-enterprise-soft';
const heatMapThemeClass = 'heatmap-theme-neon-premium';
const heatMapMotionClass = 'heatmap-motion-dramatic';

const getRuntimeFlags = (): RuntimeFlags => {
  if (typeof window === 'undefined') {
    return {
      visualRegressionMode: false,
      forceSkeleton: false,
      forceModal: false,
      forceValidation: false,
      forceNavExpanded: false,
      forceMobileNav: false,
      forceButtonStates: false,
    };
  }

  const search = new URLSearchParams(window.location.search);
  const visualRegressionMode = search.get('vr') === '1';
  const state = (search.get('state') ?? '').toLowerCase();

  return {
    visualRegressionMode,
    forceSkeleton: state === 'skeleton',
    forceModal: state === 'modal',
    forceValidation: state === 'validation',
    forceNavExpanded: state === 'nav-expanded',
    forceMobileNav: state === 'nav-mobile',
    forceButtonStates: state === 'button-states',
  };
};

const isExternalHref = (href: string): boolean => /^(https?:|mailto:)/i.test(href);

const resolveActiveNav = (pathname: string): string => {
  if (pathname === '/' || pathname === '/home') {
    return 'home';
  }

  if (pathname.startsWith('/about')) {
    return 'about';
  }

  if (pathname.startsWith('/work')) {
    return 'work';
  }

  if (pathname.startsWith('/blogs')) {
    return 'blogs';
  }

  if (
    pathname.startsWith('/more') ||
    pathname.startsWith('/labs') ||
    pathname.startsWith('/uses') ||
    pathname.startsWith('/guestbook')
  ) {
    return 'more';
  }

  if (pathname.startsWith('/contact')) {
    return 'contact';
  }

  return 'home';
};

const resolvePathTheme = (pathname: string): CinematicTheme => {
  if (pathname.startsWith('/about')) {
    return 'about';
  }

  if (pathname.startsWith('/work')) {
    return 'work';
  }

  if (pathname.startsWith('/blogs')) {
    return 'blogs';
  }

  if (
    pathname.startsWith('/more') ||
    pathname.startsWith('/labs') ||
    pathname.startsWith('/uses') ||
    pathname.startsWith('/guestbook')
  ) {
    return 'labs';
  }

  if (pathname.startsWith('/contact')) {
    return 'contact';
  }

  return 'default';
};

const HomePage = ({
  runtimeFlags,
  brightnessMode,
  linkedinHref,
  githubProfileHref,
  instagramHref,
  emailHref,
  goToContactPage,
  heroY,
  heroOpacity,
  heroLeadY,
  heroLeadOpacity,
}: HomePageProps) => (
  <>
    <section
      id="home"
      className="hero-section"
      aria-label="Hero"
      data-color-theme="default"
      data-cinematic-hook="hero-stage"
    >
      <motion.a
        className="hero-callout"
        href={githubProfileHref}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6, ease: cinematicEase }}
      >
        Building in public on GitHub
      </motion.a>

      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: 34, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.86, ease: cinematicEase }}
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {profileIdentity.heroName}
      </motion.h1>

      <motion.p
        className="hero-lead"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.75 }}
        style={{ y: heroLeadY, opacity: heroLeadOpacity }}
      >
        I build digital products with <span>measurable quality gates.</span>
      </motion.p>

      <div className="hero-meta left">
        <LocateFixed size={16} />
        <p>
          Based in {profileIdentity.locationShort},
          <span>{profileIdentity.timezoneLabel}</span>
        </p>
      </div>

      <div className="hero-meta right">
        <Globe2 size={16} />
        <p>
          {profileIdentity.roleShort},
          <span>design + engineering</span>
        </p>
      </div>
    </section>

    <section
      className="interface-grid"
      aria-label="Detail panels"
      data-color-theme="default"
      data-cinematic-hook="detail-grid"
    >
      <motion.article
        className="surface-card profile-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ ...cardRevealTransition, delay: 0.02 }}
      >
        <header>
          <h3>
            {profileIdentity.firstName} <span>{profileIdentity.lastName}</span>
          </h3>
          <p>
            {profileIdentity.locationShort} - {profileIdentity.timezoneLabel}
          </p>
        </header>
        <Suspense fallback={<WidgetFallback className="widget-loading-placeholder-cube" />}>
          <CubeWidget
            visualRegressionMode={runtimeFlags.visualRegressionMode}
            brightnessMode={brightnessMode}
          />
        </Suspense>
        <footer>
          <a href={linkedinHref} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
          <a href={githubProfileHref} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram size={16} />
          </a>
        </footer>
      </motion.article>

      <motion.article
        className="surface-card focus-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ ...cardRevealTransition, delay: 0.08 }}
      >
        <p className="caps">Precision-first product engineering</p>
        <h3>
          Interfaces
          <span>that pass visual audits.</span>
        </h3>
        <p className="muted-copy">
          {profileIdentity.roleLong}. Every release is validated for consistency, accessibility,
          and cross-browser behavior before merge.
        </p>
        <div className="pill-row">
          <span>Visual QA</span>
          <span>Performance</span>
          <span>Accessibility</span>
          <span>Reliability</span>
        </div>
      </motion.article>

      <motion.article
        className="surface-card contact-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ ...cardRevealTransition, delay: 0.14 }}
      >
        <p className="online-pill">{profileIdentity.availability}</p>
        <h3>
          Let&apos;s build a product
          <span>that survives production.</span>
        </h3>
        <a className="mail-link" href={emailHref}>
          {profileIdentity.email}
        </a>
        <button type="button" data-cta-type="primary" onClick={goToContactPage}>
          Request a Collaboration
        </button>
      </motion.article>

      <motion.article
        className="surface-card globe-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ ...cardRevealTransition, delay: 0.18 }}
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}
      >
        <style>{`
          @keyframes subtle-glow {
            0%, 100% { 
              box-shadow: 0 10px 30px rgba(91, 159, 216, 0.1),
                          0 0 1px rgba(91, 159, 216, 0.2);
            }
            50% { 
              box-shadow: 0 15px 40px rgba(91, 159, 216, 0.15),
                          0 0 1px rgba(91, 159, 216, 0.3);
            }
          }
          @keyframes number-pop {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes accent-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          /* Clean stat card */
          .enterprise-stat-card {
            position: relative;
            padding: 2rem 1.8rem;
            border-radius: 1rem;
            background: linear-gradient(145deg, rgba(12, 16, 28, 0.7) 0%, rgba(8, 12, 20, 0.9) 100%);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform, border-color, box-shadow;
            transform: translateZ(0);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          
          .enterprise-stat-card:hover {
            transform: translateY(-12px) scale(1.02);
            border-color: rgba(255, 255, 255, 0.15);
            background: linear-gradient(145deg, rgba(20, 26, 42, 0.8) 0%, rgba(12, 16, 28, 0.95) 100%);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(91, 159, 216, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          }
          
          .stat-card-corner {
            display: none;
          }
          
          .stat-number {
            font-family: 'Clash Display', sans-serif;
            font-size: clamp(3.5rem, 6vw, 4.5rem);
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff 0%, #38bdf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.8rem;
            letter-spacing: -0.02em;
            line-height: 1.1;
            animation: number-pop 1s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-variant-numeric: tabular-nums;
            color: #e0f2fe; /* fallback */
            filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.5));
          }
          
          .stat-label {
            font-family: 'Inter', sans-serif;
            font-size: 0.85rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 0.85rem;
            letter-spacing: 0.25em;
            text-transform: uppercase;
            position: relative;
            z-index: 1;
            line-height: 1.4;
          }
          
          .stat-desc {
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            color: #a5cddd;
            line-height: 1.6;
          }
            line-height: 1.5;
            position: relative;
            z-index: 1;
            font-weight: 400;
            letter-spacing: 0.01em;
          }
          
          /* Cinematic expertise section */
          .expertise-section {
            margin-top: 3rem;
            padding-top: 2.5rem;
            border-top: 1px solid rgba(91, 159, 216, 0.2);
            position: relative;
          }
          .expertise-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.8rem;
          }
          .expertise-category {
            position: relative;
            padding: 3rem 2.5rem;
            border-radius: 0.75rem;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(91, 159, 216, 0.15);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            will-change: transform, border-color;
            transform: translateZ(0);
          }
          .expertise-category::before {
            display: none;
          }
          .expertise-category::after {
            display: none;
          }
          .expertise-category:hover::before {
            display: none;
          }
          .expertise-category:hover {
            transform: translateY(-10px);
            border-color: rgba(91, 159, 216, 0.3);
            background: rgba(15, 23, 42, 0.6);
          }
          .expertise-title {
            font-size: 1.1rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: linear-gradient(90deg, #5b9fd8 0%, #7cb8ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 2.2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            position: relative;
            z-index: 2;
          }
          .expertise-title::before {
            content: '';
            width: 3px;
            height: 18px;
            background: linear-gradient(180deg, #5b9fd8 0%, #7cb8ff 100%);
            border-radius: 2px;
            flex-shrink: 0;
            animation: accent-pulse 3s ease-in-out infinite;
          }
          .expertise-item {
            font-size: 0.95rem;
            color: #a5c9e8;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.3s ease;
            position: relative;
            z-index: 2;
            font-weight: 500;
            cursor: pointer;
            margin-bottom: 0;
            padding: 0;
            border-radius: 0;
            background: none;
            border: none;
          }
          .expertise-item:hover {
            color: #e0e7ff;
            transform: translateX(6px);
            background: none;
            box-shadow: none;
            padding-left: 0;
          }
          .expertise-item::before {
            content: '→';
            color: #5b9fd8;
            font-weight: bold;
            flex-shrink: 0;
            font-size: 1rem;
            animation: none;
            filter: none;
          }
          .expertise-text {
            line-height: 1.5;
            letter-spacing: 0.01em;
          }
          
          /* Responsive mobile adjustments */
          @media (max-width: 768px) {
            .enterprise-stat-card {
              padding: 2.5rem 2rem;
            }
            .stat-number {
              font-size: 2.5rem;
            }
            .stat-label {
              font-size: 0.9rem;
            }
            .stat-desc {
              font-size: 0.75rem;
            }
            .expertise-category {
              padding: 2.5rem 2rem;
            }
            .expertise-title {
              font-size: 0.95rem;
            }
            .expertise-item {
              font-size: 0.9rem;
            }
            .expertise-grid {
              grid-template-columns: 1fr;
              gap: 1.2rem;
            }
          }
        `}</style>

        <motion.header 
          className="globe-header" 
          style={{ marginBottom: '5rem', position: 'relative', zIndex: 2 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="caps" style={{ marginBottom: '1.5rem', fontSize: '0.85rem', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.8, fontFamily: "'Inter', sans-serif" }}>Open Source Advocate</p>
          <h3 style={{ 
            lineHeight: 1.1, 
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            letterSpacing: '-0.02em',
            marginBottom: '2rem',
            fontWeight: 600,
            maxWidth: '100%',
            fontFamily: "'Clash Display', sans-serif",
            textShadow: '0 4px 30px rgba(255,255,255,0.1)'
          }}>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ display: 'inline', marginRight: '0.25em' }}
            >
              Architecting
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{ display: 'inline', marginRight: '0.25em' }}
            >
              Code
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ display: 'inline', marginRight: '0.25em' }}
            >
              for the Global
            </motion.span>
            
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{ display: 'inline', background: 'linear-gradient(90deg, #5b9fd8 0%, #7cb8ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Ecosystem
            </motion.span>
          </h3>
        </motion.header>

        <motion.div 
          style={{ 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '1.5rem', 
            alignItems: 'stretch', 
            position: 'relative', 
            zIndex: 2 ,
            marginBottom: '4rem'
          }}
        >
          {[
            { number: '150+', label: 'Pull Requests', desc: 'Architecting features and squashing bugs across core repositories.' },
            { number: '20+', label: 'Active Libraries', desc: 'Building zero-dependency, open-source tools developers truly love.' },
            { number: '10k+', label: 'Commits', desc: 'Relentlessly pushing the boundaries of modern web development.' }
          ].map((stat, idx) => (
            <motion.div 
              key={idx}
              className="enterprise-stat-card"
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ 
                delay: idx * 0.15, 
                duration: 0.6,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <div className="stat-card-corner top-left" />
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-desc">{stat.desc}</div>
              <div className="stat-card-corner bottom-right" />
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="expertise-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="expertise-grid">
            {[
              { 
                title: 'Technical Excellence', 
                items: ['Full-stack Architecture', 'Performance at Scale', 'Distributed Systems', 'Enterprise Security']
              },
              { 
                title: 'Specializations', 
                items: ['SaaS Platforms', 'Real-time Systems', 'Cloud Infrastructure', 'DevOps & Automation']
              }
            ].map((section, idx) => (
              <motion.div 
                key={idx}
                className="expertise-category"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ 
                  delay: 0.5 + (idx * 0.15),
                  duration: 0.7,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                <div className="expertise-title">{section.title}</div>
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {section.items.map((item, i) => (
                    <motion.div 
                      key={i} 
                      className="expertise-item"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ delay: 0.6 + (idx * 0.15) + (i * 0.08), duration: 0.5 }}
                    >
                      <span className="expertise-text">{item}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.article>

      <motion.article
        className="surface-card clock-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ ...cardRevealTransition, delay: 0.24 }}
      >
        <Suspense fallback={<WidgetFallback className="widget-loading-placeholder-clock" />}>
          <TimezoneClockWidget visualRegressionMode={runtimeFlags.visualRegressionMode} />
        </Suspense>
      </motion.article>
    </section>
  </>
);

const AboutPage = ({
  contributionTotal,
  heatMapWeeks,
  heatMapMonthLabels,
  heatMapCells,
}: Omit<AboutPageProps, 'runtimeFlags'>) => {
  const heatMapDetails = useMemo(
    () =>
      heatMapCells.map((cell) => {
        const countLabel = cell.count === 1 ? '1 contribution' : `${cell.count} contributions`;

        return {
          ...cell,
          countLabel,
          readableDate: formatHeatMapDate(cell.date),
          intensityLabel: heatMapIntensityLabels[cell.level] ?? heatMapIntensityLabels[0],
        };
      }),
    [heatMapCells],
  );

  const initialActiveCellIndex = useMemo(() => {
    const pinnedDateIndex = heatMapDetails.findIndex((cell) => cell.date === defaultHeatMapPinnedDate);

    if (pinnedDateIndex >= 0) {
      return pinnedDateIndex;
    }

    let latestInRangeDate = '';
    let latestInRangeIndex = 0;
    let latestActiveDate = '';
    let latestActiveIndex = 0;

    for (let index = 0; index < heatMapDetails.length; index += 1) {
      const cell = heatMapDetails[index];

      if (cell.date > githubHeatMapRange.end) {
        continue;
      }

      if (cell.date >= latestInRangeDate) {
        latestInRangeDate = cell.date;
        latestInRangeIndex = index;
      }

      if (cell.count > 0 && cell.date >= latestActiveDate) {
        latestActiveDate = cell.date;
        latestActiveIndex = index;
      }
    }

    return latestActiveDate ? latestActiveIndex : latestInRangeIndex;
  }, [heatMapDetails]);

  const [activeHeatCellIndex, setActiveHeatCellIndex] = useState(initialActiveCellIndex);

  useEffect(() => {
    setActiveHeatCellIndex(initialActiveCellIndex);
  }, [initialActiveCellIndex]);

  const activeHeatCell = heatMapDetails[activeHeatCellIndex] ?? heatMapDetails[0];
  const displayContributionTotal = Math.max(contributionTotal, heatMapContributionFloor);
  const resetHeatMapInsight = () => {
    setActiveHeatCellIndex(initialActiveCellIndex);
  };

  return (
    <>
    <SectionTitle
      sectionId="about"
      navSection="about"
      eyebrow="Get to know more about"
      title="ABOUT ME"
      script="how I build."
    />

    <section
      className="about-section"
      aria-label="About and timeline"
      data-color-theme="about"
      data-cinematic-hook="about-story"
    >
      <article className={`timeline-card ${timelineThemeClass}`.trim()}>
        <div className="timeline-items">
          {timelineEntries.map((entry, entryIndex) => (
            <motion.article
              key={entry.title}
              className="timeline-item"
              custom={entryIndex}
              variants={timelineEntryMotionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.6 }}
            >
              <div className="timeline-head">
                <p>{entry.period}</p>
                <h3>{entry.title}</h3>
                <span>{entry.org}</span>
              </div>
              <div className="timeline-focus">
                {entry.focus.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <p className="timeline-summary">{entry.summary}</p>
              <div className="timeline-body">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <div key={bullet} className="timeline-story-item">
                    <span className="timeline-story-index">0{bulletIndex + 1}</span>
                    <p>{bullet}</p>
                  </div>
                ))}
              </div>
              <div className="timeline-result">{entry.result}</div>
              <div className="timeline-tags">
                {entry.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </article>

      <article className="skills-section">
        <SkillsetDisplay />
      </article>

      <article className="heatmap-section">
        <header className="heatmap-heading">
          <p className="heatmap-eyebrow">MY CODE JOURNEY</p>
          <h3 className="heatmap-title">
            GitHub Activity
            <span>&amp; Open Source</span>
          </h3>
        </header>

        <div
          className={`heatmap-shell ${heatMapThemeClass} ${heatMapMotionClass}`.trim()}
          style={{ ['--heatmap-active-color' as string]: heatMapPalette[activeHeatCell?.level ?? 0] }}
        >
          <div className="heatmap-shell-header">
            <p className="heatmap-summary">
              <Github size={20} aria-hidden="true" />
              <span>{displayContributionTotal} contributions in the last year</span>
            </p>

            <div className="heatmap-legend" aria-label="Contribution intensity scale">
              <span>Less</span>
              <div className="heatmap-legend-swatches" aria-hidden="true">
                {heatMapPalette.map((color, index) => (
                  <i key={`legend-${index}`} style={{ backgroundColor: color }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="heatmap-insight" role="status" aria-live="polite">
            <p className="heatmap-insight-count">{activeHeatCell?.countLabel ?? 'No contributions'}</p>
            <p className="heatmap-insight-date">{activeHeatCell?.readableDate ?? 'No date selected'}</p>
            <p className="heatmap-insight-tone">
              {activeHeatCell?.intensityLabel ?? heatMapIntensityLabels[0]}
            </p>
          </div>

          <div
            className="heatmap-calendar"
            role="img"
            aria-label={`${displayContributionTotal} contributions in the last year`}
            style={{ ['--heatmap-weeks' as string]: heatMapWeeks }}
            onMouseLeave={resetHeatMapInsight}
          >
            <div className="heatmap-months" aria-hidden="true">
              {heatMapMonthLabels.map((month, index) => (
                <span key={`${month.label}-${month.columnStart}-${index}`} style={{ gridColumnStart: month.columnStart }}>
                  {month.label}
                </span>
              ))}
            </div>

            <div className="heatmap-calendar-body">
              <div className="heatmap-days" aria-hidden="true">
                <span />
                <span>Mon</span>
                <span />
                <span>Wed</span>
                <span />
                <span>Fri</span>
                <span />
              </div>

              <div className="heatmap-grid">
                {heatMapDetails.map((cell, index) => (
                  <button
                    key={`${cell.date}-${index}`}
                    type="button"
                    className={`heatmap-cell ${index === activeHeatCellIndex ? 'is-active' : ''}`.trim()}
                    data-level={cell.level}
                    tabIndex={cell.count > 0 ? 0 : -1}
                    aria-label={`${cell.countLabel} on ${cell.readableDate}`}
                    onMouseEnter={() => setActiveHeatCellIndex(index)}
                    onFocus={() => setActiveHeatCellIndex(index)}
                    onClick={() => setActiveHeatCellIndex(index)}
                    style={{ backgroundColor: heatMapPalette[cell.level] }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="heatmap-shell-foot" aria-hidden="true" />
          <p className="heatmap-updated">{heatMapLastUpdatedLabel}</p>
        </div>
      </article>
    </section>
  </>
  );
};

const WorkPage = ({ runtimeFlags, contentReady, skeletonCards }: WorkPageProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const topRowReviews = useMemo(
    () => openSourceReviews.filter((_, reviewIndex) => reviewIndex % 2 === 0),
    []
  );
  const bottomRowReviews = useMemo(
    () => openSourceReviews.filter((_, reviewIndex) => reviewIndex % 2 === 1),
    []
  );
  const voiceLanes = useMemo(
    () => [
      { laneId: 'top', reviews: topRowReviews },
      { laneId: 'bottom', reviews: bottomRowReviews },
    ],
    [topRowReviews, bottomRowReviews]
  );
  const getVoiceReviewGroups = (reviews: typeof openSourceReviews) =>
    runtimeFlags.visualRegressionMode ? [reviews] : [reviews, reviews];

  return (
    <>
      <SectionTitle
        sectionId="work-intro"
        navSection="work"
        eyebrow="Crafting digital experiences"
        title="MY WORK"
        script="through systems &amp; code."
      />

    <section
      id="work"
      className="works-section"
      aria-label="Selected work"
      data-color-theme="work"
      data-cinematic-hook="work-story"
    >
      <div className={`work-grid ${contentReady && workItems.length === 1 ? 'is-single' : ''}`.trim()}>
        {contentReady
          ? workItems.map((item, index) => {
              const isExpanded = expandedCard === item.title;
              return (
              <motion.article
                key={item.title}
                className={`work-card work-accent-${item.accent} ${workItems.length === 1 ? 'is-founder-focus' : ''} ${isExpanded ? 'is-expanded' : ''}`.trim()}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.72, delay: index * 0.06, ease: cinematicEase }}
                layout
              >
                {/* Premium Gradient Overlay */}
                <div className="work-card-overlay" aria-hidden="true" />

                {/* Visual Badge */}
                <div className="work-badge">
                  <span className="work-badge-accent">{item.accent.toUpperCase()}</span>
                </div>

                <button
                  className="work-card-header-button"
                  onClick={() => setExpandedCard(isExpanded ? null : item.title)}
                  aria-expanded={isExpanded}
                  aria-controls={`work-details-${item.title}`}
                >
                  <header className="work-header">
                    <div className="work-header-top">
                      <span className="work-category">{item.category}</span>
                      <span className="work-accent-dot" aria-hidden="true"></span>
                    </div>
                    <h3 className="work-title">{item.title}</h3>
                    <p className="work-brief">{item.description}</p>
                  </header>

                  <motion.div
                    className="work-expand-icon"
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      id={`work-details-${item.title}`}
                      className="work-details-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: cinematicEase }}
                    >
                      {item.imageSrc ? (
                        <motion.figure
                          className="work-visual-premium"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        >
                          <CinematicImage
                            className="work-visual-image"
                            src={item.imageSrc}
                            alt={item.imageAlt ?? `${item.title} preview image`}
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="work-visual-overlay" aria-hidden="true" />
                        </motion.figure>
                      ) : null}

                      <div className="work-meta-premium">
                        <motion.section
                          className="work-outcome-section-premium"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.15 }}
                        >
                          <h4 className="work-section-label">Business Impact</h4>
                          <div className="work-outcome-card">
                            <p className="work-outcome">{item.outcome}</p>
                            <div className="work-outcome-indicator" />
                          </div>
                        </motion.section>

                        <motion.section
                          className="work-stack-section-premium"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <h4 className="work-section-label">Technology Stack</h4>
                          <div className="work-stack-premium">
                            {item.stack.map((skill, stackIndex) => (
                              <motion.span
                                key={`${item.title}-${skill}`}
                                className="work-stack-chip-premium"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 + stackIndex * 0.05 }}
                                whileHover={{ scale: 1.08, y: -2 }}
                              >
                                {skill}
                              </motion.span>
                            ))}
                          </div>
                        </motion.section>

                        {item.context ? (
                          <motion.section
                            className="work-context-section-premium"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                          >
                            <h4 className="work-section-label">Technical Deep Dive</h4>
                            <div className="work-context-block-premium">
                              {item.context
                                .split(/\n\s*\n/)
                                .map((paragraph) => paragraph.trim())
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((paragraph, paragraphIndex) => (
                                  <motion.p
                                    key={`${item.title}-context-${paragraphIndex}`}
                                    className="work-context-paragraph-premium"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3 + paragraphIndex * 0.1 }}
                                  >
                                    {paragraph}
                                  </motion.p>
                                ))}
                            </div>
                          </motion.section>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
            })
          : skeletonCards.map((index) => (
              <article key={`work-skeleton-${index}`} className="work-card skeleton-card" aria-hidden="true">
                <div className="skeleton-line short" />
                <div className="skeleton-line title" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line button" />
              </article>
            ))}
      </div>
    </section>

    <section
      className="voices-section"
      aria-label="Open-source community reviews"
      data-color-theme="work"
      data-cinematic-hook="social-proof"
    >
      <motion.div
        className="voices-headline"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: cinematicEase }}
      >
        <p className="caps">Community reviews</p>
        <h3>
          The Voices <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: cinematicEase }}
          >Behind</motion.span>
        </h3>
      </motion.div>

      <motion.div 
        className={`voices-float-stage ${runtimeFlags.visualRegressionMode ? 'is-static' : ''}`.trim()}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.2,
            },
          },
        }}
      >
        <div className="voices-float-lanes">
          {voiceLanes.map((lane, laneIndex) => {
            const reviewGroups = getVoiceReviewGroups(lane.reviews);
            return (
              <div
                key={`voice-lane-${lane.laneId}`}
                className={`voices-lane voices-lane-${lane.laneId} ${runtimeFlags.visualRegressionMode ? 'is-static' : ''}`.trim()}
              >
                <div className="voices-float-track">
                  {reviewGroups.map((reviewGroup, groupIndex) => (
                    <div
                      key={`voice-group-${lane.laneId}-${groupIndex}`}
                      className="voices-float-group"
                      aria-hidden={groupIndex > 0 ? true : undefined}
                    >
                      {reviewGroup.map((item, index) => {
                        const reviewIndex =
                          laneIndex * lane.reviews.length + groupIndex * lane.reviews.length + index;
                        return (
                          <motion.article
                            key={`${lane.laneId}-${item.id}-${groupIndex}`}
                            className={`voice-float-card tone-${(reviewIndex % 4) + 1} ${runtimeFlags.visualRegressionMode ? 'is-static' : ''}`.trim()}
                            variants={{
                              hidden: { opacity: 0 },
                              visible: {
                                opacity: 1,
                                transition: {
                                  duration: 0.5,
                                  ease: cinematicEase,
                                },
                              },
                            }}
                          >
                            <motion.header
                              className="voice-float-head"
                              transition={{ duration: 0.2 }}
                            >
                              <motion.img
                                src={item.avatarUrl}
                                alt={`${item.userName} profile picture`}
                                loading="lazy"
                                decoding="async"
                                transition={{ duration: 0.2 }}
                              />
                              <div className="voice-float-user">
                                <motion.h4
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: 0.28 }}
                                >
                                  {item.userName}
                                </motion.h4>
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: 0.34 }}
                                >
                                  {item.handle}
                                </motion.p>
                              </div>
                            </motion.header>

                            <div className="voice-float-topline">
                              <motion.p
                                className="voice-float-project"
                                initial={{ opacity: 0, x: -8 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.38 }}
                              >
                                {item.project}
                              </motion.p>
                              <motion.span
                                className="voice-float-stars"
                                aria-label={`${item.stars} star review`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.25 }}
                              >
                                {'★'.repeat(item.stars)}
                              </motion.span>
                            </div>

                            <motion.p
                              className="voice-float-copy"
                              initial={{ opacity: 0, y: 8 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.42, duration: 0.45 }}
                            >
                              {item.review}
                            </motion.p>
                          </motion.article>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  </>
  );
};

const BlogsPage = ({ runtimeFlags, contentReady, blogsShouldLoad, skeletonBlogs }: BlogsPageProps) => (
  <>
    <SectionTitle
      sectionId="blogs"
      navSection="blogs"
      eyebrow="Insights I share"
      title="BLOGS"
      script="engineering notes."
    />

    <section
      className="blogs-section"
      aria-label="Blog previews"
      data-color-theme="blogs"
      data-cinematic-hook="blog-previews"
    >
      {blogsShouldLoad ? (
        <Suspense
          fallback={
            <div className="blogs-grid" aria-hidden="true">
              {skeletonBlogs.map((index) => (
                <article key={`blog-lazy-skeleton-${index}`} className="blog-card skeleton-card">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                </article>
              ))}
            </div>
          }
        >
          <DynamicBlogCards
            contentReady={contentReady}
            skeletonIndexes={skeletonBlogs}
            visualRegressionMode={runtimeFlags.visualRegressionMode}
          />
        </Suspense>
      ) : (
        <div className="blogs-grid" aria-hidden="true">
          {skeletonBlogs.map((index) => (
            <article key={`blog-deferred-skeleton-${index}`} className="blog-card skeleton-card">
              <div className="skeleton-line short" />
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
            </article>
          ))}
        </div>
      )}
    </section>
  </>
);

const MorePage = () => (
  <section
    id="more"
    className="presence-section"
    data-color-theme="labs"
    data-cinematic-hook="presence-stage"
  >
    <motion.div
      className="presence-headline"
      initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ ...cardRevealTransition, delay: 0.05 }}
    >
      <div className="presence-copy">
        <p className="caps">My digital presence</p>
        <h3>DIGITAL PRESENCE</h3>
        <p>
          Connect with me across platforms where I share product builds, engineering notes, and launch updates.
        </p>
      </div>
      <div className="presence-avatar">
        <img src="/project-4.jpg" alt={`${profileIdentity.firstName} portrait`} />
      </div>
    </motion.div>

    <div className="presence-divider" />

    <div className="presence-links">
      {socialHandles.map((item, index) => (
        <motion.a
          key={item.label}
          href={item.href}
          target={isExternalHref(item.href) ? '_blank' : undefined}
          rel={isExternalHref(item.href) ? 'noopener noreferrer' : undefined}
          className={`presence-row ${index === 0 ? 'is-primary' : ''}`}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.58, delay: 0.06 + index * 0.06, ease: cinematicEase }}
        >
          <small>{String(index + 1).padStart(2, '0')}</small>
          <span>{item.label.toUpperCase()}</span>
          <small className="presence-description">{item.description}</small>
          <i>
            <ArrowUpRight size={16} />
          </i>
        </motion.a>
      ))}
    </div>
  </section>
);

const ContactPage = ({ runtimeFlags, shouldRenderBookingScheduler, openContactModal }: ContactPageProps) => (
  <section
    id="request-collaboration"
    className="book-call-section"
    aria-label="Book a call"
    data-color-theme="contact"
    data-cinematic-hook="contact-stage"
  >
    <div className="book-copy">
      <p>Schedule / Scope / Build</p>
      <h2>
        BOOK A
        <span>CALL</span>
        WITH ME
      </h2>
      <div className="book-actions">
        <button type="button" className="primary-action" data-cta-type="primary" onClick={openContactModal}>
          <CheckCircle2 size={16} /> Start a Project
        </button>
        <button type="button" className="ghost-action" data-cta-type="secondary" onClick={openContactModal}>
          <MessageCircle size={16} /> Send a Message
        </button>
      </div>

      {runtimeFlags.visualRegressionMode || runtimeFlags.forceButtonStates ? (
        <div className="button-state-lab" aria-label="Button interaction states">
          <button type="button" className="primary-action state-default" data-cta-type="primary">Default</button>
          <button type="button" className="primary-action state-hover" data-cta-type="primary">Hover</button>
          <button type="button" className="primary-action state-active" data-cta-type="primary">Active</button>
          <button type="button" className="primary-action state-focus" data-cta-type="primary">Focus</button>
        </div>
      ) : null}
    </div>
    {shouldRenderBookingScheduler ? (
      <Suspense fallback={<WidgetFallback className="widget-loading-placeholder-booking" />}>
        <BookingScheduler visualRegressionMode={runtimeFlags.visualRegressionMode} />
      </Suspense>
    ) : (
      <WidgetFallback className="widget-loading-placeholder-booking" />
    )}
  </section>
);

const LabsPage = () => (
  <>
    <SectionTitle
      sectionId="labs-title"
      eyebrow="Experimental playground"
      title="LABS"
      script="where ideas come alive."
    />

    <section
      className="labs-route-page"
      aria-label="Labs projects"
      data-color-theme="labs"
      data-cinematic-hook="labs-grid"
    >
      <motion.header
        className="labs-route-intro"
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.66, ease: cinematicEase }}
      >
        <p>Interactive prototypes and production-ready experiments</p>
        <h3>LABS COLLECTION</h3>
      </motion.header>

      <div className="labs-route-grid">
        {labProjects.map((lab, index) => {
          const isLive = lab.status === 'LIVE';
          return (
            <motion.article
              key={lab.slug}
              className={`lab-route-card is-${lab.accent}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.52, delay: index * 0.06, ease: cinematicEase }}
            >
              <div className="lab-route-topline">
                <p className="lab-route-status">{lab.status}</p>
                <span className="lab-route-updated">{lab.lastUpdated}</span>
              </div>
              <h3>{lab.title}</h3>
              <p>{lab.description}</p>
              <div className="lab-route-meta">
                <span>{lab.category}</span>
                <span>{lab.slug.replace('-', ' ')}</span>
              </div>
              {isLive ? (
                <Link to={`/labs/${lab.slug}`} className="lab-route-link">
                  Explore <ArrowUpRight size={14} />
                </Link>
              ) : (
                <button type="button" className="lab-route-link" disabled>
                  Explore <ArrowUpRight size={14} />
                </button>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  </>
);

const MagneticBlobsPage = () => (
  <section
    className="lab-route-container"
    aria-label="Magnetic blobs simulation"
    data-color-theme="labs"
    data-cinematic-hook="lab-stage"
  >
    <Link to="/labs" className="magnetic-back-link">← Back to Labs</Link>
    <LabErrorBoundary lab="magnetic-blobs">
      <MagneticBlobsLab />
    </LabErrorBoundary>
  </section>
);

const AnimatedListPage = () => (
  <section
    className="lab-route-container"
    aria-label="Animated list simulation"
    data-color-theme="labs"
    data-cinematic-hook="lab-stage"
  >
    <Link to="/labs" className="magnetic-back-link">← Back to Labs</Link>
    <LabErrorBoundary lab="animated-list">
      <AnimatedListLab />
    </LabErrorBoundary>
  </section>
);

const GalaxyFieldPage = () => (
  <section
    className="lab-route-container"
    aria-label="Galaxy field simulation"
    data-color-theme="labs"
    data-cinematic-hook="lab-stage"
  >
    <Link to="/labs" className="magnetic-back-link">← Back to Labs</Link>
    <LabErrorBoundary lab="galaxy-field">
      <GalaxyFieldLab />
    </LabErrorBoundary>
  </section>
);

const UsesPage = () => (
  <>
    <SectionTitle
      sectionId="uses-title"
      eyebrow="Tools and hardware"
      title="USES"
      script="my workstation stack."
    />

    <section
      className="uses-route-page"
      aria-label="Uses and workstation details"
      data-color-theme="labs"
      data-cinematic-hook="uses-grid"
    >
      <article className="uses-route-copy">
        <p>01. Hardware</p>
        <h3>MY WORKSTATION</h3>
        <p>
          I believe in investing in premium, high-performance gear. Every piece of hardware in this
          setup is selected to minimize friction between thought and code.
        </p>
      </article>

      <div className="uses-route-grid">
        {usesHardware.map((item) => (
          <article key={item.id} className="uses-route-card">
            <img src={item.imageSrc} alt={item.title} loading="lazy" />
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  </>
);

const GuestbookPage = () => (
  <>
    <SectionTitle
      sectionId="guestbook-title"
      eyebrow="Leave your signature"
      title="GUEST"
      script="book"
    />

    <section
      className="guestbook-route-page"
      aria-label="Guestbook entries"
      data-color-theme="labs"
      data-cinematic-hook="guestbook-grid"
    >
      <aside className="guestbook-sign-card">
        <h3>
          Leave your
          <span>Signature!</span>
        </h3>
        <p>Sign in to leave your mark and connect with other visitors.</p>
        <button type="button">Google</button>
        <button type="button">GitHub</button>
      </aside>

      <div className="guestbook-route-grid">
        {guestbookEntries.map((entry) => (
          <article key={entry.id} className={`guestbook-entry ${entry.pinned ? 'is-pinned' : ''}`.trim()}>
            <header>
              <h4>{entry.name}</h4>
              <small>{entry.handle}</small>
            </header>
            <p>{entry.message}</p>
            {entry.pinned ? <span className="guestbook-pin">Pinned</span> : null}
          </article>
        ))}
      </div>
    </section>
  </>
);

const NotFoundPage = () => (
  <section className="route-empty-state" aria-label="Not found" data-cinematic-hook="empty-state">
    <h2>Page not found</h2>
    <p>The route you opened does not exist. Use the main navigation to continue.</p>
    <Link to="/" className="book-call-pill">Go to home</Link>
  </section>
);

export default function App() {
  const runtimeFlags = useMemo(() => getRuntimeFlags(), []);
  const shouldRenderBookingScheduler = !(runtimeFlags.visualRegressionMode && runtimeFlags.forceButtonStates);
  const [brightnessMode, setBrightnessMode] = useState<BrightnessMode>(() =>
    runtimeFlags.visualRegressionMode ? 'enterprise' : getInitialBrightnessMode(),
  );

  const [mobileNavOpen, setMobileNavOpen] = useState(() => runtimeFlags.forceMobileNav);
  const [moreMenuOpen, setMoreMenuOpen] = useState(() => runtimeFlags.forceNavExpanded);
  const [booting, setBooting] = useState(() => !runtimeFlags.visualRegressionMode);
  const [contentReady, setContentReady] = useState(
    () => runtimeFlags.visualRegressionMode && !runtimeFlags.forceSkeleton,
  );
  const [contactModalOpen, setContactModalOpen] = useState(
    () => runtimeFlags.forceModal || runtimeFlags.forceValidation,
  );

  const location = useLocation();
  const navigate = useNavigate();
  const contactModalSurfaceRef = useRef<HTMLElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const activeTheme = useMemo(() => resolvePathTheme(location.pathname), [location.pathname]);

  // Fetch GitHub contributions with fallback to static data
  const { data: githubData } = useGitHubContributions({
    username: 'swarajmundhe22-coder',
    totalContributions: githubHeatMapContributionTotal,
    contributionCells: githubHeatMapCells,
    lastUpdated: new Date().toISOString(),
  });

  // Use the fetched data if available, otherwise fall back to static data
  const heatMapCells = githubData?.contributionCells ?? githubHeatMapCells;
  const heatMapWeeks = githubHeatMapWeeks;
  const heatMapMonthLabels = githubHeatMapMonthLabels;
  const contributionTotal = githubData?.totalContributions ?? githubHeatMapContributionTotal;

  const skeletonCards = useMemo(() => Array.from({ length: 4 }, (_, index) => index), []);
  const skeletonBlogs = useMemo(() => Array.from({ length: 8 }, (_, index) => index), []);

  const githubProfileHref =
    socialHandles.find((item) => item.label === 'GitHub')?.href ??
    'https://github.com/swarajmundhe22-coder';
  const linkedinHref =
    socialHandles.find((item) => item.label === 'LinkedIn')?.href ??
    'https://www.linkedin.com/in/swaraj-mundhe-0a145b393?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app';
  const instagramHref =
    socialHandles.find((item) => item.label === 'Instagram')?.href ??
    'https://www.instagram.com/vvxxvi_15?igsh=MXZnNjd4emRjeDFyOQ==';
  const emailHref = `mailto:${profileIdentity.email}`;

  const { scrollYProgress } = useScroll();
  const ambientY = useTransform(scrollYProgress, [0, 1], ['-8%', '22%']);
  const ambientScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -96]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.28]);
  const heroLeadY = useTransform(scrollYProgress, [0, 0.2], [0, -58]);
  const heroLeadOpacity = useTransform(scrollYProgress, [0, 0.17], [1, 0.22]);

  const activeBrightnessMeta = brightnessModeMeta[brightnessMode];
  const nextBrightnessMode: BrightnessMode =
    brightnessMode === 'enterprise' ? 'enhanced-visibility' : 'enterprise';
  const nextBrightnessMeta = brightnessModeMeta[nextBrightnessMode];
  const blogsShouldLoad = runtimeFlags.visualRegressionMode || location.pathname.startsWith('/blogs');

  const activeSection = useMemo(() => resolveActiveNav(location.pathname), [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = (): void => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const spec = cinematicThemeSpecs[activeTheme];

    root.setAttribute('data-active-theme', activeTheme);
    root.style.setProperty('--realtime-color-grade-r', `${spec.rgb[0]}`);
    root.style.setProperty('--realtime-color-grade-g', `${spec.rgb[1]}`);
    root.style.setProperty('--realtime-color-grade-b', `${spec.rgb[2]}`);
    root.style.setProperty('--cinematic-hue-shift', `${spec.hueShift}deg`);
    root.style.setProperty('--cinematic-saturation', spec.saturation.toFixed(3));
    root.style.setProperty('--cinematic-lift', spec.lift.toFixed(3));
  }, [activeTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const hashTarget = decodeURIComponent(location.hash.replace('#', ''));
    if (!hashTarget) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const scrollToTarget = (): void => {
      const targetElement = document.getElementById(hashTarget);
      if (!targetElement) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        return;
      }

      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    };

    const timer = window.setTimeout(scrollToTarget, 40);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash, prefersReducedMotion]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const unsubscribe = scrollYProgress.on('change', (value) => {
      const progress = clampPercent(value);
      root.style.setProperty('--scroll-percent', progress.toFixed(4));
      root.style.setProperty('--grain-opacity', (0.25 - progress * 0.1).toFixed(3));
      root.style.setProperty('--cinematic-scroll-hue', `${(progress * 8).toFixed(2)}deg`);
    });

    return () => {
      unsubscribe();
    };
  }, [scrollYProgress]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const trackedElements = new Set<HTMLElement>();

    const collect = (selector: string, mutate?: (element: HTMLElement) => void): void => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        mutate?.(element);
        trackedElements.add(element);
      });
    };

    collect('section, .surface-card, .portfolio-app > *, .work-card, .blog-card, .presence-row', (element) => {
      if (!element.dataset.cinematicHook) {
        element.dataset.cinematicHook = 'reveal';
      }
    });

    cinematicThemeSelectors.forEach(({ selector, theme }) => {
      collect(selector, (element) => {
        if (!element.dataset.colorTheme) {
          element.dataset.colorTheme = theme;
        }
      });
    });

    cinematicDepthSelectors.forEach(({ selector, depth }) => {
      collect(selector, (element) => {
        element.dataset.cinematicDepth = depth.toFixed(2);
        element.style.setProperty('--cinematic-depth', depth.toFixed(2));
      });
    });

    cinematicSoundHookSelectors.forEach(({ selector, hook }) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.dataset.soundHook = hook;
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          target.dataset.cinematicState = entry.isIntersecting ? 'active' : 'idle';

          if (!entry.isIntersecting || entry.intersectionRatio < 0.65) {
            return;
          }

          const theme = target.dataset.colorTheme as CinematicTheme | undefined;
          if (!theme) {
            return;
          }

          const themeSpec = cinematicThemeSpecs[theme];
          root.setAttribute('data-scroll-theme', theme);
          root.style.setProperty('--realtime-color-grade-r', `${themeSpec.rgb[0]}`);
          root.style.setProperty('--realtime-color-grade-g', `${themeSpec.rgb[1]}`);
          root.style.setProperty('--realtime-color-grade-b', `${themeSpec.rgb[2]}`);
          root.style.setProperty('--cinematic-hue-shift', `${themeSpec.hueShift}deg`);
          root.style.setProperty('--cinematic-saturation', themeSpec.saturation.toFixed(3));
          root.style.setProperty('--cinematic-lift', themeSpec.lift.toFixed(3));
        });
      },
      {
        threshold: [0, 0.25, 0.55, 0.8],
        rootMargin: '0px 0px -10% 0px',
      },
    );

    trackedElements.forEach((element) => observer.observe(element));

    const onSoundSignal = (event: Event): void => {
      const target =
        (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-sound-hook], [data-cta-type]') ??
        null;

      if (!target) {
        return;
      }

      const hook =
        target.dataset.soundHook ??
        (target.dataset.ctaType === 'primary' ? 'cta-primary' : 'cta-secondary');

      if (!hook) {
        return;
      }

      root.style.setProperty('--cinematic-audio-pulse', event.type === 'click' ? '1' : '0.5');
      window.dispatchEvent(
        new CustomEvent('agon:ui-sound-hook', {
          detail: {
            hook,
            source: event.type,
          },
        }),
      );
    };

    document.addEventListener('pointerenter', onSoundSignal, true);
    document.addEventListener('focusin', onSoundSignal, true);
    document.addEventListener('click', onSoundSignal, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('pointerenter', onSoundSignal, true);
      document.removeEventListener('focusin', onSoundSignal, true);
      document.removeEventListener('click', onSoundSignal, true);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (runtimeFlags.visualRegressionMode || prefersReducedMotion) {
      return;
    }

    const scope = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>('[data-cinematic-hook="section-title"], .surface-card, .work-card, .blog-card')
        .forEach((element: HTMLElement, index: number) => {
          gsap.fromTo(
            element,
            {
              y: 24,
              autoAlpha: 0.84,
            },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.86,
              ease: 'power3.out',
              delay: Math.min(index * 0.02, 0.22),
              scrollTrigger: {
                trigger: element,
                start: 'top 84%',
                end: 'top 58%',
                scrub: 0.35,
              },
            },
          );
        });

      gsap.to('.film-grain', {
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: {
          trigger: 'main',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });
    });

    return () => {
      scope.revert();
    };
  }, [location.pathname, prefersReducedMotion, runtimeFlags.visualRegressionMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-brightness-mode', brightnessMode);
    }

    if (!runtimeFlags.visualRegressionMode && typeof window !== 'undefined') {
      window.localStorage.setItem(brightnessModeStorageKey, brightnessMode);
    }
  }, [brightnessMode, runtimeFlags.visualRegressionMode]);

  useEffect(() => {
    if (!booting) {
      return;
    }

    const timeout = window.setTimeout(() => setBooting(false), 940);
    return () => window.clearTimeout(timeout);
  }, [booting]);

  useEffect(() => {
    if (contentReady || runtimeFlags.forceSkeleton) {
      return;
    }

    const delay = runtimeFlags.visualRegressionMode ? 0 : 680;
    const timer = window.setTimeout(() => setContentReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [contentReady, runtimeFlags.forceSkeleton, runtimeFlags.visualRegressionMode]);

  useEffect(() => {
    if (!contactModalOpen) {
      return;
    }

    const modalSurface = contactModalSurfaceRef.current;
    if (modalSurface) {
      const firstFocusable = modalSurface.querySelector<HTMLElement>(
        'input, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setContactModalOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !modalSurface) {
        return;
      }

      const focusableElements = Array.from(
        modalSurface.querySelectorAll<HTMLElement>(
          'input, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [contactModalOpen]);

  const goToRoute = (id: string, hash?: string): void => {
    const routeMap: Record<string, string> = {
      home: '/',
      about: '/about',
      work: '/work',
      blogs: '/blogs',
      more: '/more',
      contact: '/contact',
    };

    setMobileNavOpen(false);
    setMoreMenuOpen(false);
    const route = routeMap[id] ?? '/';
    navigate(hash ? `${route}${hash}` : route);
  };

  const openContactModal = (): void => {
    setContactModalOpen(true);
  };

  const toggleBrightnessMode = (): void => {
    setBrightnessMode((current) =>
      current === 'enterprise' ? 'enhanced-visibility' : 'enterprise',
    );
  };

  return (
    <>
      <AnimatedCursor />
      <motion.div
        className="boot-loader"
        initial={{ opacity: 1 }}
        animate={{ opacity: booting ? 1 : 0, pointerEvents: booting ? 'auto' : 'none' }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
        <div className="boot-loader__mark">{profileIdentity.monogram}</div>
        <div className="boot-loader__bar">
          <span className="boot-loader__fill" />
        </div>
      </motion.div>

      <div className="portfolio-app" data-brightness-mode={brightnessMode}>
        <motion.div className="ambient-ring" style={{ y: ambientY, scale: ambientScale }} />
        <div className="film-grain" aria-hidden="true" />

        <header className="floating-header">
          <Link to="/" className="brand-block" aria-label="Back to home">
            <span className="brand-monogram">{profileIdentity.monogram}</span>
            <span className="brand-copy">
              <small>Creative Engineer</small>
              <strong>Shipping Verified Quality</strong>
            </span>
          </Link>

          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <nav className={`nav-shell ${mobileNavOpen ? 'is-open' : ''}`}>
            <div className="nav-pill">
              {navLinks.map((link) => {
                if (link.id === 'more') {
                  return (
                    <div className="more-anchor" key={link.id}>
                      <button
                        type="button"
                        className={`nav-link ${activeSection === link.id || moreMenuOpen ? 'is-active' : ''}`}
                        onClick={() => setMoreMenuOpen((open) => !open)}
                      >
                        {link.label}
                      </button>
                      <div className={`more-menu ${moreMenuOpen ? 'is-open' : ''}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileNavOpen(false);
                            setMoreMenuOpen(false);
                            navigate('/labs');
                          }}
                        >
                          Labs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileNavOpen(false);
                            setMoreMenuOpen(false);
                            navigate('/guestbook');
                          }}
                        >
                          Guestbook
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileNavOpen(false);
                            setMoreMenuOpen(false);
                            navigate('/more');
                          }}
                        >
                          Links
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    key={link.id}
                    className={`nav-link ${activeSection === link.id ? 'is-active' : ''}`}
                    onClick={() => goToRoute(link.id)}
                  >
                    {link.label}
                  </button>
                );
              })}

              <button
                type="button"
                className={`theme-button ${brightnessMode === 'enhanced-visibility' ? 'is-enhanced' : ''}`}
                aria-label={`Switch brightness mode to ${nextBrightnessMeta.label}. Current mode: ${activeBrightnessMeta.label}.`}
                title={`${activeBrightnessMeta.label}: UI ${activeBrightnessMeta.uiBrightnessRange[0].toFixed(2)}-${activeBrightnessMeta.uiBrightnessRange[1].toFixed(2)}x, cube exposure ${activeBrightnessMeta.cubeExposureRange[0].toFixed(2)}-${activeBrightnessMeta.cubeExposureRange[1].toFixed(2)}.`}
                onClick={toggleBrightnessMode}
              >
                <MoonStar size={14} />
              </button>

              <button
                type="button"
                className="book-call-pill"
                data-cta-type="primary"
                onClick={() => {
                  setMobileNavOpen(false);
                  setMoreMenuOpen(false);
                  navigate('/contact');
                }}
              >
                Book a Call
              </button>
            </div>
          </nav>

          <button type="button" className="cmd-badge" aria-label="Command menu">
            <Command size={15} />
          </button>
        </header>

        <main>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="route-transition-shell"
              data-cinematic-hook="route-shell"
              initial={{ opacity: 0, y: 18, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.998 }}
              transition={{ duration: 0.42, ease: cinematicEase }}
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <HomePage
                      runtimeFlags={runtimeFlags}
                      brightnessMode={brightnessMode}
                      linkedinHref={linkedinHref}
                      githubProfileHref={githubProfileHref}
                      instagramHref={instagramHref}
                      emailHref={emailHref}
                      goToContactPage={() => goToRoute('contact', '#request-collaboration')}
                      heroY={heroY}
                      heroOpacity={heroOpacity}
                      heroLeadY={heroLeadY}
                      heroLeadOpacity={heroLeadOpacity}
                    />
                  }
                />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route
                  path="/about"
                  element={
                    <AboutPage
                      contributionTotal={contributionTotal}
                      heatMapWeeks={heatMapWeeks}
                      heatMapMonthLabels={heatMapMonthLabels}
                      heatMapCells={heatMapCells}
                    />
                  }
                />
                <Route
                  path="/work"
                  element={<WorkPage runtimeFlags={runtimeFlags} contentReady={contentReady} skeletonCards={skeletonCards} />}
                />
                <Route
                  path="/blogs"
                  element={
                    <BlogsPage
                      runtimeFlags={runtimeFlags}
                      contentReady={contentReady}
                      blogsShouldLoad={blogsShouldLoad}
                      skeletonBlogs={skeletonBlogs}
                    />
                  }
                />
                <Route path="/blogs/:slug" element={<BlogArticlePage />} />
                <Route path="/more" element={<MorePage />} />
                <Route
                  path="/contact"
                  element={
                    <ContactPage
                      runtimeFlags={runtimeFlags}
                      shouldRenderBookingScheduler={shouldRenderBookingScheduler}
                      openContactModal={openContactModal}
                    />
                  }
                />
                <Route path="/labs" element={<LabsPage />} />
                <Route path="/labs/magnetic-blobs" element={<MagneticBlobsPage />} />
                <Route path="/labs/animated-list" element={<AnimatedListPage />} />
                <Route path="/labs/galaxy-field" element={<GalaxyFieldPage />} />
                <Route path="/uses" element={<UsesPage />} />
                <Route path="/guestbook" element={<GuestbookPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="site-footer" id="contact">
          <div className="footer-hero-card">
            <h2>
              Let's ship<br />
              <span>something precise.</span>
            </h2>
            <div className="hero-ring"></div>
          </div>

          <div className="footer-layout">
            <section className="footer-links">
              <article className="footer-brand">
                <h4>{profileIdentity.heroName}</h4>
                <p>
                  Building digital experiences that are measurable,
                  accessible, and reliable at launch. Every interaction is
                  engineered for production confidence.
                </p>
              </article>

              <div className="footer-nav-groups">
                {footerGroups.map((group) => (
                  <article key={group.title} className="footer-group">
                    <h5>{group.title}</h5>
                    {group.links.map((link) =>
                      isExternalHref(link.href) ? (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link key={link.label} to={link.href}>
                          {link.label}
                        </Link>
                      ),
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="footer-bottom">
            <small>© 2026 {profileIdentity.copyrightName}. All rights reserved.</small>
            <div className="footer-socials">
              <a href={githubProfileHref} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github size={16} />
              </a>
              <a href={linkedinHref} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin size={16} />
              </a>
              <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={16} />
              </a>
            </div>
          </section>
        </footer>
      </div>
    </>
  );
}
