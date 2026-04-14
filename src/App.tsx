import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Command,
  ExternalLink,
  Github,
  Globe2,
  Linkedin,
  LocateFixed,
  Mail,
  Menu,
  MessageCircle,
  MoonStar,
  Send,
  Twitter,
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
import BlogArticlePage from './components/BlogArticlePage';
import CinematicImage from './components/CinematicImage';
import SkillsetDisplay from './components/SkillsetDisplay';
import AnimatedCursor from './components/AnimatedCursor';
import LabErrorBoundary from './components/labs/LabErrorBoundary';
import MagneticBlobsLab from './labs/magnetic/MagneticBlobsLab';
import AnimatedListLab from './labs/animated-list/AnimatedListLab';
import GalaxyFieldLab from './labs/galaxy/GalaxyFieldLab';
import './App.css';
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
  repositoryHref: string;
  githubProfileHref: string;
  issuesHref: string;
  emailHref: string;
  openContactModal: () => void;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  heroLeadY: MotionValue<number>;
  heroLeadOpacity: MotionValue<number>;
}

interface AboutPageProps {
  runtimeFlags: RuntimeFlags;
  contributionTotal: number;
  heatMapLevels: number[];
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
const heatMapMonthLabels = [
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
] as const;

const getHeatValue = (index: number): number => {
  const seeded = Math.sin(index * 13.7 + 2.5) * 43758.5453;
  return clampPercent(seeded - Math.floor(seeded));
};

const getHeatLevel = (value: number): number => {
  if (value > 0.82) {
    return 4;
  }

  if (value > 0.63) {
    return 3;
  }

  if (value > 0.42) {
    return 2;
  }

  if (value > 0.2) {
    return 1;
  }

  return 0;
};

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
  repositoryHref,
  githubProfileHref,
  issuesHref,
  emailHref,
  openContactModal,
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
        rel="noreferrer"
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
          <a href={repositoryHref} target="_blank" rel="noreferrer" aria-label="Repository">
            <Linkedin size={16} />
          </a>
          <a href={githubProfileHref} target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a href={issuesHref} target="_blank" rel="noreferrer" aria-label="Open issues">
            <Twitter size={16} />
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
        <button type="button" data-cta-type="primary" onClick={openContactModal}>
          Request collaboration
        </button>
      </motion.article>

      <motion.article
        className="surface-card globe-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ ...cardRevealTransition, delay: 0.18 }}
      >
        <header className="globe-header">
          <p className="caps">Available globally</p>
          <h3>
            Adaptable across
            <br />
            time zones
          </h3>
        </header>
        <Suspense fallback={<WidgetFallback className="widget-loading-placeholder-globe" />}>
          <GlobeWidget visualRegressionMode={runtimeFlags.visualRegressionMode} />
        </Suspense>
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

      <motion.article
        className="surface-card founder-surface"
        initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ ...cardRevealTransition, delay: 0.28 }}
      >
        <p className="founder-copy" style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700, letterSpacing: '0.02em' }}>
          Founder of <span className="founder-name" style={{ color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>ARVYA</span>
        </p>
        <p className="sub-script">Designing and shipping measurable web products</p>
        <div className="phone-strip">
          <div className="phone-mock group">
            <div className="phone-overlay">
              <span className="overlay-text interactive-font" style={{ fontFamily: "monospace, monospace", fontWeight: "bold", fontSize: "1.1rem", textTransform: 'uppercase' }}>Deploying Soon !</span>
            </div>
          </div>
          <div className="phone-mock tilt group">
            <div className="phone-overlay">
              <span className="overlay-text interactive-font" style={{ fontFamily: "monospace, monospace", fontWeight: "bold", fontSize: "1.1rem", textTransform: 'uppercase' }}>Deploying Soon !</span>
            </div>
          </div>
          <div className="phone-mock tilt-neg group">
            <div className="phone-overlay">
              <span className="overlay-text interactive-font" style={{ fontFamily: "monospace, monospace", fontWeight: "bold", fontSize: "1.1rem", textTransform: 'uppercase' }}>Deploying Soon !</span>
            </div>
          </div>
        </div>
      </motion.article>
    </section>
  </>
);

const AboutPage = ({ contributionTotal, heatMapLevels }: Omit<AboutPageProps, 'runtimeFlags'>) => (
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
      <article className="timeline-card">
        <div className="timeline-items">
          {timelineEntries.map((entry) => (
            <motion.article
              key={entry.title}
              className="timeline-item"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="timeline-head">
                <p>{entry.period}</p>
                <h3>{entry.title}</h3>
                <span>{entry.org}</span>
              </div>
              <div className="timeline-body">
                {entry.bullets.map((bullet) => (
                  <p key={bullet}>{bullet}</p>
                ))}
              </div>
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

        <div className="heatmap-shell">
          <div className="heatmap-shell-header">
            <p className="heatmap-summary">
              <Github size={20} aria-hidden="true" />
              <span>{contributionTotal} contributions in the last year</span>
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

          <div
            className="heatmap-calendar"
            role="img"
            aria-label={`${contributionTotal} contributions in the last year`}
          >
            <div className="heatmap-months" aria-hidden="true">
              {heatMapMonthLabels.map((month, index) => (
                <span key={`${month}-${index}`} style={{ gridColumn: `${index * 4 + 1} / span 4` }}>
                  {month}
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

              <div className="heatmap-grid" aria-hidden="true">
                {heatMapLevels.map((level, index) => (
                  <i key={`heat-${index}`} data-level={level} style={{ backgroundColor: heatMapPalette[level] }} />
                ))}
              </div>
            </div>
          </div>

          <div className="heatmap-shell-foot" aria-hidden="true" />
        </div>
      </article>
    </section>
  </>
);

const WorkPage = ({ runtimeFlags, contentReady, skeletonCards }: WorkPageProps) => (
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
          ? workItems.map((item, index) => (
              <motion.article
                key={item.title}
                className={`work-card ${workItems.length === 1 ? 'is-founder-focus' : ''}`.trim()}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.72, delay: index * 0.06, ease: cinematicEase }}
              >
                <p>{item.category}</p>
                <h3>{item.title}</h3>
                {item.imageSrc ? (
                  <figure className="work-visual">
                    <CinematicImage
                      className="work-visual-image"
                      src={item.imageSrc}
                      alt={item.imageAlt ?? `${item.title} preview image`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                    />
                  </figure>
                ) : null}
                <p className="desc">{item.description}</p>
                <div className="work-meta">
                  <div className="work-stack">
                    {item.stack.map((skill) => (
                      <span key={`${item.title}-${skill}`}>{skill}</span>
                    ))}
                  </div>
                  <p className="work-outcome">{item.outcome}</p>
                  {item.context ? (
                    <div className="work-context-block">
                      {item.context
                        .split(/\n\s*\n/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, paragraphIndex) => (
                          <p key={`${item.title}-context-${paragraphIndex}`} className="work-context">
                            {paragraph}
                          </p>
                        ))}
                    </div>
                  ) : null}
                </div>
                <a href={item.href} target="_blank" rel="noreferrer">
                  View repository <ArrowUpRight size={16} />
                </a>
              </motion.article>
            ))
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

      <article className="logic-band">
        <p className="caps">Behind the curtains</p>
        <h3>
          Decoding logic
          <span>&amp; release confidence</span>
        </h3>
      </article>
    </section>

    <section
      className="voices-section"
      aria-label="Open-source community reviews"
      data-color-theme="work"
      data-cinematic-hook="social-proof"
    >
      <p className="caps">Community reviews</p>
      <h3>
        The Voices <span>Behind</span>
      </h3>
      <div className={`voices-float-stage ${runtimeFlags.visualRegressionMode ? 'is-static' : ''}`.trim()}>
        {openSourceReviews.map((item, index) => (
          <motion.article
            key={item.id}
            className={`voice-float-card lane-${(index % 8) + 1} drift-${(index % 4) + 1} ${runtimeFlags.visualRegressionMode ? 'is-static' : ''}`.trim()}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: index * 0.05, ease: cinematicEase }}
          >
            <header className="voice-float-head">
              <img src={item.avatarUrl} alt={`${item.userName} profile picture`} loading="lazy" decoding="async" />
              <div className="voice-float-user">
                <h4>{item.userName}</h4>
                <p>{item.handle}</p>
              </div>
            </header>

            <div className="voice-float-topline">
              <p className="voice-float-project">{item.project}</p>
              <span className="voice-float-stars" aria-label={`${item.stars} star review`}>
                {'★'.repeat(item.stars)}
              </span>
            </div>

            <p className="voice-float-copy">"{item.review}"</p>
          </motion.article>
        ))}
      </div>
    </section>
  </>
);

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
      <div>
        <p className="caps">My digital presence</p>
        <h3>
          <span>MY</span> DIGITAL
          <strong>PRESENCE</strong>
        </h3>
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
          rel={isExternalHref(item.href) ? 'noreferrer' : undefined}
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
    id="contact"
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
              <p className="lab-route-status">{lab.status}</p>
              <h3>{lab.title}</h3>
              <p>{lab.description}</p>
              <div className="lab-route-meta">
                <span>{lab.category}</span>
                <span>{lab.lastUpdated}</span>
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

  const heatMapCells = useMemo(() => {
    const total = 52 * 7;
    return Array.from({ length: total }, (_, index) => getHeatValue(index + 1));
  }, []);

  const heatMapLevels = useMemo(() => heatMapCells.map((value) => getHeatLevel(value)), [heatMapCells]);
  const contributionTotal = 1159;

  const skeletonCards = useMemo(() => Array.from({ length: 4 }, (_, index) => index), []);
  const skeletonBlogs = useMemo(() => Array.from({ length: 6 }, (_, index) => index), []);

  const githubProfileHref =
    socialHandles.find((item) => item.label === 'GitHub Profile')?.href ??
    'https://github.com/Sartahkakaedar';
  const repositoryHref =
    socialHandles.find((item) => item.label === 'Main Repository')?.href ??
    'https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-';
  const issuesHref =
    socialHandles.find((item) => item.label === 'Open Issues')?.href ??
    'https://github.com/Sartahkakaedar/On-Lookers-Founder-Portfolio-/issues';
  const emailHref =
    socialHandles.find((item) => item.label === 'Email')?.href ??
    'mailto:swarajmundhe22@gmail.com';

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

  const goToRoute = (id: string): void => {
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
    navigate(routeMap[id] ?? '/');
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
                      repositoryHref={repositoryHref}
                      githubProfileHref={githubProfileHref}
                      issuesHref={issuesHref}
                      emailHref={emailHref}
                      openContactModal={openContactModal}
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
                      heatMapLevels={heatMapLevels}
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
                          rel="noreferrer"
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
              <a href={githubProfileHref} target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github size={16} />
              </a>
              <a href={repositoryHref} target="_blank" rel="noreferrer" aria-label="Repository">
                <Linkedin size={16} />
              </a>
              <a href={issuesHref} target="_blank" rel="noreferrer" aria-label="Open issues">
                <X size={16} />
              </a>
              <a href={emailHref} aria-label="Email">
                <Mail size={16} />
              </a>
              <a href={emailHref} aria-label="Direct Message">
                <Send size={16} />
              </a>
              <a href={repositoryHref} target="_blank" rel="noreferrer" aria-label="External">
                <ExternalLink size={16} />
              </a>
            </div>
          </section>
        </footer>
      </div>
    </>
  );
}
