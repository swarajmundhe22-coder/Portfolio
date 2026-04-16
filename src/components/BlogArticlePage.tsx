import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, ClipboardCheck, Gauge, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { blogPosts } from '../data/portfolioData';
import { fetchBlogPosts, type RenderedBlogPost } from '../lib/blogFeed';

const cinematicEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface PlaybookStep {
  title: string;
  action: string;
  expectedResult: string;
}

interface PlaybookFaq {
  question: string;
  answer: string;
}

interface BlogPlaybook {
  problem: string;
  diagnosisChecklist: string[];
  actionPlan: PlaybookStep[];
  pitfalls: string[];
  faq: PlaybookFaq[];
  successSignal: string;
}

interface ScorecardMetric {
  id: string;
  label: string;
  prompt: string;
  weight: number;
}

interface BlogToolkit {
  audienceLabel: string;
  audienceSegments: string[];
  useCase: string;
  calculatorTitle: string;
  calculatorPrompt: string;
  templateTitle: string;
  templateFields: string[];
  scorecardMetrics: ScorecardMetric[];
}

const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const staticFallbackPosts: RenderedBlogPost[] = blogPosts.map((post, index) => {
  const imageNumber = (index % 4) + 1;
  const publishDateIso = new Date(post.date).toISOString();

  return {
    slug: toSlug(post.title),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    featuredImageUrl: `/project-${imageNumber}.jpg`,
    featuredImageSet: `/project-${imageNumber}.jpg 1x, /project-${imageNumber}.jpg 2x`,
    publishDateIso,
    publishDateLabel: post.date,
    readTimeLabel: post.readTime,
    authorName: 'Swaraj Mundhe',
  };
});

const normalizeSlug = (slug: string | undefined): string =>
  (slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

const trimText = (value: string, maxLength = 170): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const buildFallbackPlaybook = (article: RenderedBlogPost): BlogPlaybook => {
  const coreParagraphs = article.content.filter(Boolean);
  const checks = coreParagraphs.slice(0, 4).map((paragraph) => trimText(paragraph, 130));
  const plan = coreParagraphs.slice(0, 4).map((paragraph, index) => ({
    title: `Execution checkpoint ${index + 1}`,
    action: trimText(paragraph, 240),
    expectedResult: `Checkpoint ${index + 1} should reduce uncertainty before you continue.`,
  }));

  return {
    problem: article.excerpt,
    diagnosisChecklist:
      checks.length > 0
        ? checks
        : [
            'Confirm the issue is reproducible on the same route and dataset.',
            'Capture exact user impact before applying any fix.',
            'Verify whether the issue is caused by data, UI state, or deployment drift.',
          ],
    actionPlan:
      plan.length > 0
        ? plan
        : [
            {
              title: 'Reproduce the issue reliably',
              action: 'Create one deterministic test case that reproduces the issue each run.',
              expectedResult: 'The issue can be validated quickly during every iteration.',
            },
            {
              title: 'Apply the smallest safe fix',
              action: 'Fix one failure path first and validate behavior before broad changes.',
              expectedResult: 'You gain confidence without creating hidden regressions.',
            },
          ],
    pitfalls: [
      'Shipping a fix before proving the root cause.',
      'Relying on one local success without regression checks.',
      'Skipping error-path and accessibility validation.',
    ],
    faq: [
      {
        question: 'What should I do first?',
        answer: 'Start with a deterministic reproduction, then measure impact before coding changes.',
      },
      {
        question: 'How do I know the fix is production-safe?',
        answer: 'Validate with automated tests, manual critical-path checks, and monitoring after release.',
      },
    ],
    successSignal: 'Users stop reporting the issue and your regression checks remain clean for at least one full release cycle.',
  };
};

const buildFallbackToolkit = (article: RenderedBlogPost): BlogToolkit => ({
  audienceLabel: 'Product and engineering teams',
  audienceSegments: ['Product Managers', 'Frontend Engineers', 'Engineering Leads'],
  useCase: `Use this guide when ${article.title.toLowerCase()} is causing delivery risk or team confusion.`,
  calculatorTitle: 'Release Checklist Scorecard',
  calculatorPrompt: 'Score each signal from 0 (not ready) to 5 (ready) before shipping.',
  templateTitle: 'Execution template',
  templateFields: [
    'Problem statement and affected users',
    'Current risk level and release deadline',
    'Top 3 blockers and owners',
    'Validation plan before release',
    'Rollback trigger and monitoring owner',
  ],
  scorecardMetrics: [
    {
      id: 'scope-confidence',
      label: 'Scope confidence',
      prompt: 'Is the release scope clearly bounded?',
      weight: 3,
    },
    {
      id: 'test-coverage',
      label: 'Test coverage',
      prompt: 'Do automated and manual checks cover critical flows?',
      weight: 3,
    },
    {
      id: 'observability',
      label: 'Observability',
      prompt: 'Will failures be visible quickly after launch?',
      weight: 2,
    },
    {
      id: 'rollback-readiness',
      label: 'Rollback readiness',
      prompt: 'Can the team safely roll back in minutes?',
      weight: 2,
    },
  ],
});

const curatedToolkits: Record<string, BlogToolkit> = {
  'why-react-threejs-real-time-simulation-for-infrastructure-intelligence': {
    audienceLabel: 'Founders and infrastructure product teams',
    audienceSegments: ['Founders', 'CTOs', 'Infrastructure Product Managers'],
    useCase:
      'Use this when you need to prove scientific reliability and operator trust before scaling an infrastructure intelligence product.',
    calculatorTitle: 'Forecast Confidence Scorecard',
    calculatorPrompt: 'Rate readiness signals before promoting a model update to production.',
    templateTitle: 'Founder decision template',
    templateFields: [
      'Target infrastructure cohort and risk horizon',
      'Model confidence threshold required for launch',
      'Operator decision workflow after risk alert',
      'Incident drill outcome and remediation owner',
      'Post-launch accuracy review cadence',
    ],
    scorecardMetrics: [
      {
        id: 'model-confidence',
        label: 'Model confidence quality',
        prompt: 'Confidence intervals are stable on production-like data.',
        weight: 3,
      },
      {
        id: 'data-freshness',
        label: 'Data freshness',
        prompt: 'Sensor ingestion latency stays within SLA.',
        weight: 2,
      },
      {
        id: 'operator-clarity',
        label: 'Operator clarity',
        prompt: 'Operators can identify next action in under two minutes.',
        weight: 3,
      },
      {
        id: 'drill-readiness',
        label: 'Incident drill readiness',
        prompt: 'Teams have completed scenario replay drills successfully.',
        weight: 2,
      },
    ],
  },
  'frame-matching-a-portfolio-from-video-only': {
    audienceLabel: 'Frontend teams shipping cinematic UI',
    audienceSegments: ['Frontend Engineers', 'UI Engineers', 'Design System Teams'],
    useCase:
      'Use this when converting visual references into production components without motion drift.',
    calculatorTitle: 'Motion Fidelity Scorecard',
    calculatorPrompt: 'Score whether your implementation still matches intended pacing and feel.',
    templateTitle: 'Motion implementation template',
    templateFields: [
      'Reference sequence and keyframe timestamps',
      'Motion token mapping (duration, delay, easing)',
      'Interactive versus cinematic transition split',
      'Reduced-motion fallback behavior',
      'Validation snapshots and reviewer sign-off',
    ],
    scorecardMetrics: [
      {
        id: 'timing-ledger',
        label: 'Timing ledger completeness',
        prompt: 'Key animation events have explicit timing tokens.',
        weight: 3,
      },
      {
        id: 'responsive-parity',
        label: 'Responsive parity',
        prompt: 'The same pacing quality is preserved across viewports.',
        weight: 2,
      },
      {
        id: 'interaction-snappiness',
        label: 'Interaction snappiness',
        prompt: 'Controls remain fast while cinematic transitions play.',
        weight: 3,
      },
      {
        id: 'motion-test-coverage',
        label: 'Motion test coverage',
        prompt: 'Behavioral snapshots protect key transitions in CI.',
        weight: 2,
      },
    ],
  },
  'design-drift-is-a-ci-problem-not-a-qa-problem': {
    audienceLabel: 'Frontend platform and product quality teams',
    audienceSegments: ['Frontend Platform Leads', 'QA Engineers', 'Product Designers'],
    useCase:
      'Use this when visual regressions keep surfacing after merge and release confidence is dropping.',
    calculatorTitle: 'Release Checklist Scorecard',
    calculatorPrompt: 'Score CI readiness before shipping visual changes.',
    templateTitle: 'Visual gate rollout template',
    templateFields: [
      'Critical routes covered by snapshots',
      'Deterministic fixtures and dynamic noise controls',
      'Baseline ownership and approval policy',
      'Diff review format in pull requests',
      'Merge-block policy and exception process',
    ],
    scorecardMetrics: [
      {
        id: 'snapshot-determinism',
        label: 'Snapshot determinism',
        prompt: 'Snapshots are stable and reproducible across runs.',
        weight: 3,
      },
      {
        id: 'coverage-depth',
        label: 'Coverage depth',
        prompt: 'Critical routes and components are covered in CI.',
        weight: 2,
      },
      {
        id: 'review-signal',
        label: 'Review signal quality',
        prompt: 'Diff artifacts are concise and actionable for reviewers.',
        weight: 3,
      },
      {
        id: 'policy-enforcement',
        label: 'Policy enforcement',
        prompt: 'Visual regressions block merge unless explicitly approved.',
        weight: 2,
      },
    ],
  },
  'design-drift-is-a-ci-problem': {
    audienceLabel: 'Frontend platform and product quality teams',
    audienceSegments: ['Frontend Platform Leads', 'QA Engineers', 'Product Designers'],
    useCase:
      'Use this when visual regressions keep surfacing after merge and release confidence is dropping.',
    calculatorTitle: 'Release Checklist Scorecard',
    calculatorPrompt: 'Score CI readiness before shipping visual changes.',
    templateTitle: 'Visual gate rollout template',
    templateFields: [
      'Critical routes covered by snapshots',
      'Deterministic fixtures and dynamic noise controls',
      'Baseline ownership and approval policy',
      'Diff review format in pull requests',
      'Merge-block policy and exception process',
    ],
    scorecardMetrics: [
      {
        id: 'snapshot-determinism',
        label: 'Snapshot determinism',
        prompt: 'Snapshots are stable and reproducible across runs.',
        weight: 3,
      },
      {
        id: 'coverage-depth',
        label: 'Coverage depth',
        prompt: 'Critical routes and components are covered in CI.',
        weight: 2,
      },
      {
        id: 'review-signal',
        label: 'Review signal quality',
        prompt: 'Diff artifacts are concise and actionable for reviewers.',
        weight: 3,
      },
      {
        id: 'policy-enforcement',
        label: 'Policy enforcement',
        prompt: 'Visual regressions block merge unless explicitly approved.',
        weight: 2,
      },
    ],
  },
  'building-reliable-contact-pipelines-with-supabase': {
    audienceLabel: 'Founders and product teams managing lead funnels',
    audienceSegments: ['Founders', 'Growth Product Managers', 'Full-stack Engineers'],
    useCase:
      'Use this when lead quality, spam control, and submission reliability are affecting revenue.',
    calculatorTitle: 'Lead Pipeline Reliability Scorecard',
    calculatorPrompt: 'Score risk before releasing contact-form or schema updates.',
    templateTitle: 'Lead pipeline template',
    templateFields: [
      'Primary conversion path and expected submission volume',
      'Validation schema ownership and version plan',
      'Error taxonomy and user remediation copy',
      'Spam controls and rate-limit thresholds',
      'Monitoring dashboard and alert owners',
    ],
    scorecardMetrics: [
      {
        id: 'schema-alignment',
        label: 'Schema alignment',
        prompt: 'Client and server validations are fully aligned.',
        weight: 3,
      },
      {
        id: 'error-clarity',
        label: 'Error clarity',
        prompt: 'API errors are actionable and user-safe.',
        weight: 2,
      },
      {
        id: 'spam-resilience',
        label: 'Spam resilience',
        prompt: 'Abuse controls are tested under burst traffic.',
        weight: 3,
      },
      {
        id: 'funnel-observability',
        label: 'Funnel observability',
        prompt: 'Submission success and failure are fully monitored.',
        weight: 2,
      },
    ],
  },
  'motion-values-that-feel-premium-at-60-fps': {
    audienceLabel: 'Frontend teams and design-system maintainers',
    audienceSegments: ['Frontend Engineers', 'Design System Leads', 'Product Designers'],
    useCase:
      'Use this when interactions feel sluggish or inconsistent across routes and devices.',
    calculatorTitle: 'Motion Quality Scorecard',
    calculatorPrompt: 'Score motion quality before merging interaction-heavy changes.',
    templateTitle: 'Motion QA template',
    templateFields: [
      'Motion token tier mapping by component intent',
      'Frame-time budget per route section',
      'Reduced-motion variant behavior',
      'Interaction latency checks on real devices',
      'Regression capture points for CI',
    ],
    scorecardMetrics: [
      {
        id: 'token-discipline',
        label: 'Token discipline',
        prompt: 'Durations and easing follow system tokens.',
        weight: 3,
      },
      {
        id: 'performance-budget',
        label: 'Performance budget',
        prompt: 'Animation complexity stays within frame-time budget.',
        weight: 3,
      },
      {
        id: 'ux-clarity',
        label: 'UX clarity',
        prompt: 'Motion reinforces hierarchy and user comprehension.',
        weight: 2,
      },
      {
        id: 'device-validation',
        label: 'Device validation',
        prompt: 'Mid-range device checks are part of release QA.',
        weight: 2,
      },
    ],
  },
  'responsive-qa-checklist-for-320-to-1440-widths': {
    audienceLabel: 'Frontend QA and product delivery teams',
    audienceSegments: ['QA Engineers', 'Frontend Engineers', 'Product Managers'],
    useCase:
      'Use this when responsive regressions keep escaping to production across breakpoint transitions.',
    calculatorTitle: 'Responsive Readiness Scorecard',
    calculatorPrompt: 'Score viewport reliability before release.',
    templateTitle: 'Viewport QA template',
    templateFields: [
      'Viewport matrix (canonical + transition widths)',
      'Structure/interaction/rhythm pass outcomes',
      'Touch, keyboard, and focus validation notes',
      'Sticky and scroll behavior checks',
      'Release blocker criteria by viewport tier',
    ],
    scorecardMetrics: [
      {
        id: 'viewport-coverage',
        label: 'Viewport coverage',
        prompt: 'Transition widths are tested, not only standard presets.',
        weight: 3,
      },
      {
        id: 'interaction-ergonomics',
        label: 'Interaction ergonomics',
        prompt: 'Tap targets, focus order, and keyboard access remain correct.',
        weight: 2,
      },
      {
        id: 'layout-integrity',
        label: 'Layout integrity',
        prompt: 'No clipping, overflow, or hierarchy collapse across matrix.',
        weight: 3,
      },
      {
        id: 'release-gating',
        label: 'Release gating',
        prompt: 'CI includes responsive blockers and required checks.',
        weight: 2,
      },
    ],
  },
  'accessibility-contrast-audits-without-guesswork': {
    audienceLabel: 'Product teams scaling accessible design systems',
    audienceSegments: ['Product Designers', 'Frontend Engineers', 'Accessibility Specialists'],
    useCase:
      'Use this when contrast regressions keep returning after design or theme updates.',
    calculatorTitle: 'Accessibility Confidence Scorecard',
    calculatorPrompt: 'Score WCAG resilience before approving token or theme changes.',
    templateTitle: 'Accessibility release template',
    templateFields: [
      'Token pair policy and expected contrast ratios',
      'State matrix (default, hover, focus, active, disabled)',
      'Theme coverage and assistive tech checks',
      'CI rule outputs and remediation owners',
      'Post-release accessibility monitoring plan',
    ],
    scorecardMetrics: [
      {
        id: 'token-policy',
        label: 'Token policy completeness',
        prompt: 'Semantic token pairs are documented and enforced.',
        weight: 3,
      },
      {
        id: 'state-coverage',
        label: 'State coverage',
        prompt: 'All interaction states are tested for compliance.',
        weight: 2,
      },
      {
        id: 'ci-enforcement',
        label: 'CI enforcement',
        prompt: 'Contrast failures block merge with actionable details.',
        weight: 3,
      },
      {
        id: 'content-reality',
        label: 'Real-content validation',
        prompt: 'Long, localized, and mixed hierarchy content was validated.',
        weight: 2,
      },
    ],
  },
  'debugging-frontend-incidents-before-users-notice': {
    audienceLabel: 'Founders and frontend incident response teams',
    audienceSegments: ['Founders', 'Frontend Leads', 'SRE and QA Teams'],
    useCase:
      'Use this when production instability needs a repeatable triage and release recovery workflow.',
    calculatorTitle: 'Incident Response Readiness Scorecard',
    calculatorPrompt: 'Score your incident process before the next release window.',
    templateTitle: 'Incident triage template',
    templateFields: [
      'Incident summary: what failed and who is impacted',
      'Three-lane diagnosis ownership (render, network, environment)',
      'Reproduction script or failing test reference',
      'Fix rollout, rollback trigger, and monitoring owner',
      'Postmortem improvements and follow-up deadline',
    ],
    scorecardMetrics: [
      {
        id: 'detection-speed',
        label: 'Detection speed',
        prompt: 'Client-side signals detect incidents before user reports.',
        weight: 3,
      },
      {
        id: 'triage-clarity',
        label: 'Triage clarity',
        prompt: 'Roles and lanes are clear during investigation.',
        weight: 2,
      },
      {
        id: 'fix-safety',
        label: 'Fix safety',
        prompt: 'A deterministic repro test validates the fix.',
        weight: 3,
      },
      {
        id: 'post-release-monitoring',
        label: 'Post-release monitoring',
        prompt: 'Recovery metrics are tracked after rollout.',
        weight: 2,
      },
    ],
  },
};

const curatedPlaybooks: Record<string, BlogPlaybook> = {
  'why-react-threejs-real-time-simulation-for-infrastructure-intelligence': {
    problem:
      'Teams building infrastructure intelligence often struggle with two failures: scientifically weak forecasts or visuals that hide risk instead of clarifying it.',
    diagnosisChecklist: [
      'Sensor calibration history is available and has no stale gaps longer than your model tolerance.',
      'Simulation outputs include confidence intervals, not only point predictions.',
      '3D hazard views are tied to the same IDs used by your simulation pipeline.',
      'Decision makers can explain what to do next in under two minutes after viewing one scenario.',
    ],
    actionPlan: [
      {
        title: 'Lock data contracts before UI polish',
        action:
          'Define typed contracts for each model output: risk score, confidence, horizon, and affected asset IDs. Reject payloads missing any of these fields.',
        expectedResult: 'You prevent silent mismatches between the simulation service and 3D layer.',
      },
      {
        title: 'Separate compute cadence from render cadence',
        action:
          'Run electrochemical simulations on a background schedule and push snapshots to clients. Keep render updates event-driven and lightweight.',
        expectedResult: 'The interface remains smooth while model complexity increases.',
      },
      {
        title: 'Design for operator decisions, not visual novelty',
        action:
          'Each visual state should answer one question: what fails first, when, and what action reduces risk. Remove visual effects that do not support that answer.',
        expectedResult: 'Operators make earlier, clearer mitigation decisions.',
      },
      {
        title: 'Add release gates for scientific and UX integrity',
        action:
          'Use baseline model test datasets plus visual regression snapshots of critical hazard views in CI before deployment.',
        expectedResult: 'You avoid both prediction drift and UI miscommunication in production.',
      },
    ],
    pitfalls: [
      'Treating model confidence as optional metadata.',
      'Rendering every sensor point on the main thread with no aggregation strategy.',
      'Allowing visual palette choices to imply certainty not backed by model confidence.',
    ],
    faq: [
      {
        question: 'How much simulation detail should reach the frontend?',
        answer: 'Ship decision-ready aggregates and confidence ranges, then reveal raw detail on demand for investigation.',
      },
      {
        question: 'Can this architecture scale beyond one asset class?',
        answer: 'Yes, if contracts are asset-agnostic and the 3D layer resolves asset-specific overlays from shared primitives.',
      },
    ],
    successSignal:
      'Risk meetings shift from debating data reliability to prioritizing mitigation actions because both forecast quality and visual clarity are trusted.',
  },
  'frame-matching-a-portfolio-from-video-only': {
    problem:
      'Video references are easy to imitate visually but hard to replicate in timing and interaction behavior, which causes cinematic UIs to feel fake in production.',
    diagnosisChecklist: [
      'You have timestamped keyframes for hero reveal, card stagger, and route transitions.',
      'Spacing values were measured from multiple frames, not inferred from one screenshot.',
      'Interaction timings differ from section-entry timings by design.',
      'Reduced-motion behavior preserves information hierarchy without breaking layout rhythm.',
    ],
    actionPlan: [
      {
        title: 'Create a timing ledger',
        action:
          'Document delays, durations, and ease curves for each major motion event from the source recording.',
        expectedResult: 'The team shares one canonical timing reference instead of subjective interpretation.',
      },
      {
        title: 'Build spacing from ratios, not static pixels',
        action:
          'Convert measured spacing into ratio-based rules tied to viewport and type scale.',
        expectedResult: 'The layout keeps the original feel across responsive breakpoints.',
      },
      {
        title: 'Split motion into cinematic and interactive tiers',
        action:
          'Keep dramatic transitions for section reveals while preserving short response times for controls and navigation.',
        expectedResult: 'The interface feels premium without harming usability.',
      },
      {
        title: 'Validate with behavioral snapshots',
        action:
          'Capture snapshots at deterministic timestamps and compare them in CI alongside route-level interactions.',
        expectedResult: 'Animation intent remains stable release after release.',
      },
    ],
    pitfalls: [
      'Using one global duration value for all elements.',
      'Matching color and layout while ignoring timing cadence.',
      'Skipping mobile playback validation for transition-heavy views.',
    ],
    faq: [
      {
        question: 'How many keyframes are enough?',
        answer: 'Capture every structural phase change, usually 8-12 checkpoints for one route-level sequence.',
      },
      {
        question: 'How do I prevent overfitting to one viewport?',
        answer: 'Validate timing and spacing against at least one compact and one wide viewport before finalizing tokens.',
      },
    ],
    successSignal:
      'Reviewers can no longer distinguish the implementation from the reference recording when comparing interaction flow, not just static frames.',
  },
  'design-drift-is-a-ci-problem-not-a-qa-problem': {
    problem:
      'Visual quality usually degrades because teams detect drift during manual QA, after layout regressions already spread across screens.',
    diagnosisChecklist: [
      'Visual snapshots run on every pull request for core routes and components.',
      'Snapshot fixtures disable dynamic noise such as random data, system time, and motion.',
      'Diff artifacts are grouped by severity so reviewers can triage quickly.',
      'Failed visual checks block merge unless an intentional baseline update is approved.',
    ],
    actionPlan: [
      {
        title: 'Define deterministic capture conditions',
        action:
          'Freeze clocks, mock unstable APIs, and run with consistent fonts and viewport matrix before generating baselines.',
        expectedResult: 'Visual tests stop failing due to environmental randomness.',
      },
      {
        title: 'Scope baseline ownership',
        action:
          'Assign baseline approval responsibility to one engineering-designer pair per product surface.',
        expectedResult: 'Intentional visual changes are reviewed with accountability.',
      },
      {
        title: 'Gate by impact, not pixel count only',
        action:
          'Combine threshold checks with semantic checks for spacing, typography, and contrast rules.',
        expectedResult: 'Important regressions are caught even when raw diff area is small.',
      },
      {
        title: 'Publish compact diff summaries in PRs',
        action:
          'Include route name, changed regions, and before/after previews in pull request comments.',
        expectedResult: 'Review cycles become faster and visual discussions become evidence-based.',
      },
    ],
    pitfalls: [
      'Allowing baseline updates without explicit product intent.',
      'Testing only desktop snapshots and assuming mobile parity.',
      'Ignoring accessibility state visuals such as focus rings and error banners.',
    ],
    faq: [
      {
        question: 'What is the minimum viable visual gate?',
        answer: 'Start with one critical route matrix and one component matrix, then expand coverage each sprint.',
      },
      {
        question: 'How do we avoid reviewer fatigue?',
        answer: 'Group diffs by component and show only changed regions with clear labels.',
      },
    ],
    successSignal:
      'Design regressions are found before merge and release week no longer includes emergency visual cleanup.',
  },
  'design-drift-is-a-ci-problem': {
    problem:
      'Visual quality usually degrades because teams detect drift during manual QA, after layout regressions already spread across screens.',
    diagnosisChecklist: [
      'Visual snapshots run on every pull request for core routes and components.',
      'Snapshot fixtures disable dynamic noise such as random data, system time, and motion.',
      'Diff artifacts are grouped by severity so reviewers can triage quickly.',
      'Failed visual checks block merge unless an intentional baseline update is approved.',
    ],
    actionPlan: [
      {
        title: 'Define deterministic capture conditions',
        action:
          'Freeze clocks, mock unstable APIs, and run with consistent fonts and viewport matrix before generating baselines.',
        expectedResult: 'Visual tests stop failing due to environmental randomness.',
      },
      {
        title: 'Scope baseline ownership',
        action:
          'Assign baseline approval responsibility to one engineering-designer pair per product surface.',
        expectedResult: 'Intentional visual changes are reviewed with accountability.',
      },
      {
        title: 'Gate by impact, not pixel count only',
        action:
          'Combine threshold checks with semantic checks for spacing, typography, and contrast rules.',
        expectedResult: 'Important regressions are caught even when raw diff area is small.',
      },
      {
        title: 'Publish compact diff summaries in PRs',
        action:
          'Include route name, changed regions, and before/after previews in pull request comments.',
        expectedResult: 'Review cycles become faster and visual discussions become evidence-based.',
      },
    ],
    pitfalls: [
      'Allowing baseline updates without explicit product intent.',
      'Testing only desktop snapshots and assuming mobile parity.',
      'Ignoring accessibility state visuals such as focus rings and error banners.',
    ],
    faq: [
      {
        question: 'What is the minimum viable visual gate?',
        answer: 'Start with one critical route matrix and one component matrix, then expand coverage each sprint.',
      },
      {
        question: 'How do we avoid reviewer fatigue?',
        answer: 'Group diffs by component and show only changed regions with clear labels.',
      },
    ],
    successSignal:
      'Design regressions are found before merge and release week no longer includes emergency visual cleanup.',
  },
  'building-reliable-contact-pipelines-with-supabase': {
    problem:
      'Contact systems fail users when validation, storage contracts, and operational alerts are disconnected, causing silent data loss or unusable lead data.',
    diagnosisChecklist: [
      'Client and server validation schemas are generated from one shared source.',
      'Error responses return actionable codes rather than generic messages.',
      'Rate limiting and anti-spam logic are active on the API route.',
      'Operational notifications fire when submission failure ratio exceeds threshold.',
    ],
    actionPlan: [
      {
        title: 'Unify validation contracts',
        action:
          'Use one schema package for client parsing and server enforcement to remove drift between UX checks and persistence rules.',
        expectedResult: 'Users see consistent validation behavior before and after submission.',
      },
      {
        title: 'Design explicit failure taxonomy',
        action:
          'Map invalid input, duplicate submissions, and storage failures to distinct response shapes with remediation hints.',
        expectedResult: 'Support and engineering can triage incidents quickly.',
      },
      {
        title: 'Instrument submission funnel metrics',
        action:
          'Track attempts, accepted submissions, and rejection reasons segmented by route and campaign source.',
        expectedResult: 'You can detect real conversion blockers instead of guessing.',
      },
      {
        title: 'Rehearse rollback-safe schema changes',
        action:
          'Deploy additive changes first, backfill data, and only then enforce new constraints.',
        expectedResult: 'Schema evolution remains safe under live traffic.',
      },
    ],
    pitfalls: [
      'Client-only validation with no server enforcement.',
      'Inserting free-form payloads that bypass typed contracts.',
      'Treating spam filtering as a post-launch task.',
    ],
    faq: [
      {
        question: 'Should I block or queue ambiguous submissions?',
        answer: 'Queue them with a review status when business value is possible, but always mark confidence and validation errors.',
      },
      {
        question: 'How do I prevent duplicate submissions?',
        answer: 'Use idempotency keys per session and route plus a short server-side dedupe window.',
      },
    ],
    successSignal:
      'Submission success rate stays high while malformed and spam payloads are rejected with clear, low-friction user guidance.',
  },
  'motion-values-that-feel-premium-at-60-fps': {
    problem:
      'Motion systems often look good in demos but break under real load, creating laggy interactions and inconsistent timing across routes.',
    diagnosisChecklist: [
      'Each animation category has a defined duration range and easing family.',
      'Interaction-critical elements never wait behind long cinematic transitions.',
      'Frame-time profiling has been run on at least one mid-range device.',
      'Reduced-motion mode preserves hierarchy without removing essential context.',
    ],
    actionPlan: [
      {
        title: 'Create timing tokens by intent',
        action:
          'Define fast, medium, and cinematic tiers with strict usage examples so teams stop inventing arbitrary durations.',
        expectedResult: 'Motion feels coherent across pages and components.',
      },
      {
        title: 'Budget animation complexity per view',
        action:
          'Limit simultaneous transforms, blur filters, and large-layer opacity animations within a single viewport phase.',
        expectedResult: 'Frame rate remains stable during heavy sections.',
      },
      {
        title: 'Prefer transform and opacity-only interactions',
        action:
          'Avoid layout-triggering properties for frequent interactions and reserve expensive effects for rare hero moments.',
        expectedResult: 'UI responsiveness improves without reducing visual quality.',
      },
      {
        title: 'Add motion regression checks',
        action:
          'Capture key transition frames at fixed timestamps and compare in CI with route-level snapshots.',
        expectedResult: 'Motion polish survives feature iteration.',
      },
    ],
    pitfalls: [
      'Animating too many elements in parallel on scroll.',
      'Treating reduced-motion as disabling everything.',
      'Using long durations for primary call-to-action feedback.',
    ],
    faq: [
      {
        question: 'What should be the default interaction duration?',
        answer: 'Start around 180-220ms for controls and validate against perceived responsiveness on real devices.',
      },
      {
        question: 'How do I keep cinematic quality without jank?',
        answer: 'Constrain cinematic transitions to route or section entry and keep core interactions lightweight.',
      },
    ],
    successSignal:
      'Users describe the experience as smooth and intentional while performance traces show stable frame time during interaction-heavy flows.',
  },
  'responsive-qa-checklist-for-320-to-1440-widths': {
    problem:
      'Most responsive bugs appear between standard breakpoints, where typography, spacing, and interaction density change at the same time.',
    diagnosisChecklist: [
      'Viewport matrix includes both canonical widths and transition widths.',
      'Focus order and keyboard navigation are tested on narrow layouts.',
      'Sticky and fixed elements were validated with real scrolling behavior.',
      'Touch target sizes remain accessible after density adjustments.',
    ],
    actionPlan: [
      {
        title: 'Define a tiered viewport test matrix',
        action:
          'Test compact, transition, medium, and wide widths with at least one height-constrained scenario.',
        expectedResult: 'Layout regressions are caught before reaching production.',
      },
      {
        title: 'Run three-pass QA for each route',
        action:
          'Validate structure first, interaction second, and visual rhythm third to avoid missing subtle breakpoints.',
        expectedResult: 'You catch both functional and aesthetic responsive failures.',
      },
      {
        title: 'Automate route snapshots and manual interaction sweeps',
        action:
          'Use screenshot automation for broad coverage and manual checks for scroll, gesture, and navigation feel.',
        expectedResult: 'You avoid blind spots from either method alone.',
      },
      {
        title: 'Capture responsive release criteria in CI',
        action:
          'Block release when overflow, clipping, or contrast regressions appear in required viewport tiers.',
        expectedResult: 'Responsive quality becomes measurable and enforceable.',
      },
    ],
    pitfalls: [
      'Testing only phone and desktop while skipping transition widths.',
      'Assuming media-query changes automatically preserve tab order.',
      'Ignoring long-content scenarios during responsive checks.',
    ],
    faq: [
      {
        question: 'How many viewport widths should I test?',
        answer: 'Start with 6-8 strategic widths and expand where your analytics show meaningful traffic.',
      },
      {
        question: 'What is the fastest way to prevent clipping bugs?',
        answer: 'Add overflow and min-content assertions in automated route tests for every critical section.',
      },
    ],
    successSignal:
      'Support tickets related to layout and interaction breakpoints drop while release confidence improves across device classes.',
  },
  'accessibility-contrast-audits-without-guesswork': {
    problem:
      'Teams often treat contrast as visual preference, which causes accessibility debt whenever themes, states, or brand updates are introduced.',
    diagnosisChecklist: [
      'Color tokens encode intended contrast pairs, not isolated swatches.',
      'All interactive states are included in contrast audits, including disabled and focus-visible.',
      'Automated checks run in CI for each theme mode and critical component.',
      'Manual assistive-technology validation confirms readability in realistic scenarios.',
    ],
    actionPlan: [
      {
        title: 'Model contrast as token relationships',
        action:
          'Store foreground-background pair intent in your token system, then generate component-level usage from those pairs.',
        expectedResult: 'Design updates no longer break contrast silently.',
      },
      {
        title: 'Audit every interaction state',
        action:
          'Run automated checks against default, hover, active, disabled, and focus-visible states in both brightness modes.',
        expectedResult: 'Accessibility holds during real user interaction, not just static screens.',
      },
      {
        title: 'Tie CI failures to exact token pairs',
        action:
          'When contrast fails, report token names and component contexts so fixes are immediate and traceable.',
        expectedResult: 'Resolution time drops and repeat violations decrease.',
      },
      {
        title: 'Review with real content and language variance',
        action:
          'Test long text, mixed-case headings, and localized strings to verify readability under realistic constraints.',
        expectedResult: 'Accessible contrast remains robust after content growth.',
      },
    ],
    pitfalls: [
      'Passing AA in default state but failing in hover or disabled states.',
      'Hardcoding colors in components instead of using semantic tokens.',
      'Skipping contrast checks when introducing brand refreshes.',
    ],
    faq: [
      {
        question: 'Should contrast checks run on every pull request?',
        answer: 'Yes. Accessibility regressions should fail early just like unit and integration regressions.',
      },
      {
        question: 'How do I manage theme variants safely?',
        answer: 'Use semantic token layers and validate each variant automatically with the same component matrix.',
      },
    ],
    successSignal:
      'Contrast compliance remains stable release over release, including interaction states and theme variants, without last-minute accessibility patches.',
  },
};

const resolvePlaybook = (article: RenderedBlogPost): BlogPlaybook =>
  curatedPlaybooks[article.slug] ?? curatedPlaybooks[normalizeSlug(article.title)] ?? buildFallbackPlaybook(article);

const resolveToolkit = (article: RenderedBlogPost): BlogToolkit =>
  curatedToolkits[article.slug] ?? curatedToolkits[normalizeSlug(article.title)] ?? buildFallbackToolkit(article);

const clampScore = (value: number): number => Math.min(5, Math.max(0, value));

const resolveScoreBand = (score: number): string => {
  if (score >= 82) {
    return 'Launch-ready';
  }

  if (score >= 64) {
    return 'Needs hardening';
  }

  return 'High release risk';
};

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<RenderedBlogPost[]>(staticFallbackPosts);
  const [loading, setLoading] = useState(true);
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>({});
  const [scoreInputs, setScoreInputs] = useState<Record<string, number>>({});
  const [copyFeedback, setCopyFeedback] = useState('');

  const normalizedSlug = normalizeSlug(slug);

  useEffect(() => {
    let disposed = false;

    const loadPosts = async () => {
      try {
        const nextPosts = await fetchBlogPosts();
        if (!disposed && nextPosts.length > 0) {
          setPosts(nextPosts);
        }
      } catch {
        if (!disposed) {
          setPosts(staticFallbackPosts);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      disposed = true;
    };
  }, []);

  const article = useMemo(
    () => posts.find((item) => item.slug === normalizedSlug) ?? null,
    [normalizedSlug, posts],
  );

  const playbook = useMemo(
    () => (article ? resolvePlaybook(article) : null),
    [article],
  );

  const toolkit = useMemo(
    () => (article ? resolveToolkit(article) : null),
    [article],
  );

  useEffect(() => {
    setCompletedChecks({});
    setScoreInputs({});
    setCopyFeedback('');
  }, [article?.slug]);

  useEffect(() => {
    if (!article || !toolkit) {
      return;
    }

    const initialScores = toolkit.scorecardMetrics.reduce<Record<string, number>>((accumulator, metric) => {
      accumulator[`${article.slug}-${metric.id}`] = 3;
      return accumulator;
    }, {});

    setScoreInputs(initialScores);
  }, [article, toolkit]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timeout = window.setTimeout(() => setCopyFeedback(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyFeedback]);

  const completedCount = useMemo(() => {
    if (!article || !playbook) {
      return 0;
    }

    return playbook.diagnosisChecklist.reduce((total, _item, index) => {
      const key = `${article.slug}-${index}`;
      return completedChecks[key] ? total + 1 : total;
    }, 0);
  }, [article, completedChecks, playbook]);

  const scoreSummary = useMemo(() => {
    if (!article || !toolkit || toolkit.scorecardMetrics.length === 0) {
      return { percent: 0, label: 'Unavailable' };
    }

    let weightedTotal = 0;
    let maxTotal = 0;

    toolkit.scorecardMetrics.forEach((metric) => {
      const key = `${article.slug}-${metric.id}`;
      const value = clampScore(scoreInputs[key] ?? 3);
      weightedTotal += value * metric.weight;
      maxTotal += 5 * metric.weight;
    });

    const percent = maxTotal > 0 ? Math.round((weightedTotal / maxTotal) * 100) : 0;
    return { percent, label: resolveScoreBand(percent) };
  }, [article, toolkit, scoreInputs]);

  const toggleChecklistItem = (index: number): void => {
    if (!article) {
      return;
    }

    const key = `${article.slug}-${index}`;
    setCompletedChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const updateScoreMetric = (metricId: string, nextValue: number): void => {
    if (!article) {
      return;
    }

    const key = `${article.slug}-${metricId}`;
    setScoreInputs((current) => ({
      ...current,
      [key]: clampScore(nextValue),
    }));
  };

  const copyPlaybook = async (): Promise<void> => {
    if (!playbook || !toolkit || !article || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyFeedback('Copy unavailable');
      return;
    }

    const checklist = playbook.diagnosisChecklist
      .map((item, index) => `${index + 1}. ${item}`)
      .join('\n');
    const steps = playbook.actionPlan
      .map(
        (step, index) =>
          `${index + 1}. ${step.title}\nAction: ${step.action}\nExpected result: ${step.expectedResult}`,
      )
      .join('\n\n');

    const output = [
      `${article.title} - Interactive Resolution Playbook`,
      '',
      `Audience: ${toolkit.audienceLabel}`,
      `Use case: ${toolkit.useCase}`,
      `Scorecard: ${scoreSummary.percent}% (${scoreSummary.label})`,
      '',
      `Problem: ${playbook.problem}`,
      '',
      'Diagnosis checklist:',
      checklist,
      '',
      'Action plan:',
      steps,
      '',
      'Common pitfalls:',
      ...playbook.pitfalls.map((item) => `- ${item}`),
      '',
      `Success signal: ${playbook.successSignal}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(output);
      setCopyFeedback('Playbook copied');
    } catch {
      setCopyFeedback('Copy failed');
    }
  };

  const copyTemplate = async (): Promise<void> => {
    if (!article || !toolkit || typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyFeedback('Copy unavailable');
      return;
    }

    const scorecardLines = toolkit.scorecardMetrics
      .map((metric) => {
        const key = `${article.slug}-${metric.id}`;
        const currentValue = clampScore(scoreInputs[key] ?? 3);
        return `- ${metric.label}: ${currentValue}/5 (${metric.prompt})`;
      })
      .join('\n');

    const template = [
      `${toolkit.templateTitle} - ${article.title}`,
      '',
      `Audience: ${toolkit.audienceLabel}`,
      `Use case: ${toolkit.useCase}`,
      '',
      'Template fields:',
      ...toolkit.templateFields.map((field, index) => `${index + 1}. ${field}:`),
      '',
      `${toolkit.calculatorTitle} snapshot:`,
      scorecardLines,
      '',
      `Readiness score: ${scoreSummary.percent}% (${scoreSummary.label})`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(template);
      setCopyFeedback('Template copied');
    } catch {
      setCopyFeedback('Copy failed');
    }
  };

  if (!loading && !article) {
    return (
      <section className="blog-article-page" aria-label="Blog article not found">
        <div className="blog-article-shell">
          <Link to="/blogs" className="blog-article-back">
            <ArrowLeft size={16} /> Back to blogs
          </Link>
          <h1>Article not found</h1>
          <p>The requested article does not exist or has been moved.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="blog-article-page" aria-label="Blog article">
      <motion.article
        className="blog-article-shell"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: cinematicEase }}
      >
        <Link to="/blogs" className="blog-article-back">
          <ArrowLeft size={16} /> Back to blogs
        </Link>

        {article ? (
          <>
            <img
              src={article.featuredImageUrl}
              srcSet={article.featuredImageSet}
              alt={article.title}
              className="blog-article-image"
              loading="eager"
            />

            <p className="blog-article-meta">
              <CalendarDays size={15} /> {article.publishDateLabel} - {article.readTimeLabel} - {article.authorName}
            </p>

            <h1>{article.title}</h1>
            <p className="blog-article-dek">{article.excerpt}</p>

            <div className="blog-article-body">
              {article.content.map((paragraph, index) => (
                <p key={`${article.slug}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>

            {playbook && toolkit && (
              <section className="blog-playbook" aria-label="Interactive blog playbook">
                <header className="blog-playbook-header">
                  <div>
                    <p className="blog-playbook-kicker">Practical guide</p>
                    <h2>Interactive Resolution Playbook</h2>
                  </div>
                  <div className="blog-playbook-actions">
                    <button type="button" className="blog-playbook-copy" onClick={copyPlaybook}>
                      <ClipboardCheck size={15} /> Copy plan
                    </button>
                    <button type="button" className="blog-playbook-copy is-secondary" onClick={copyTemplate}>
                      <ClipboardCheck size={15} /> Copy template
                    </button>
                  </div>
                </header>

                <p className="blog-playbook-problem">{playbook.problem}</p>
                <div className="blog-playbook-audience">
                  <p className="blog-playbook-audience-line">
                    <Users size={15} /> Built for {toolkit.audienceLabel}
                  </p>
                  <div className="blog-audience-tag-row">
                    {toolkit.audienceSegments.map((segment) => (
                      <span key={`${article.slug}-${segment}`} className="blog-audience-tag">
                        {segment}
                      </span>
                    ))}
                  </div>
                  <p className="blog-playbook-usecase">{toolkit.useCase}</p>
                </div>
                <p className="blog-playbook-progress">
                  {completedCount}/{playbook.diagnosisChecklist.length} diagnostics complete
                  {' - '}
                  Scorecard {scoreSummary.percent}% ({scoreSummary.label})
                  {copyFeedback ? ` - ${copyFeedback}` : ''}
                </p>

                <div className="blog-playbook-grid">
                  <article className="blog-playbook-card">
                    <h3>Quick diagnosis checklist</h3>
                    <ul className="blog-checklist">
                      {playbook.diagnosisChecklist.map((item, index) => {
                        const key = `${article.slug}-${index}`;
                        const checked = Boolean(completedChecks[key]);

                        return (
                          <li key={`${article.slug}-check-${index}`}>
                            <label>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleChecklistItem(index)}
                              />
                              <span>{item}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </article>

                  <article className="blog-playbook-card">
                    <h3>Step-by-step action plan</h3>
                    <div className="blog-action-plan">
                      {playbook.actionPlan.map((step, index) => (
                        <details
                          key={`${article.slug}-step-${index}`}
                          className="blog-step"
                          open={index === 0}
                        >
                          <summary>
                            Step {index + 1}: {step.title}
                          </summary>
                          <p>{step.action}</p>
                          <p className="blog-step-outcome">Expected result: {step.expectedResult}</p>
                        </details>
                      ))}
                    </div>
                  </article>

                  <article className="blog-playbook-card">
                    <h3>
                      <Gauge size={14} /> {toolkit.calculatorTitle}
                    </h3>
                    <p className="blog-scorecard-help">{toolkit.calculatorPrompt}</p>
                    <div className="blog-scorecard-list">
                      {toolkit.scorecardMetrics.map((metric) => {
                        const key = `${article.slug}-${metric.id}`;
                        const score = clampScore(scoreInputs[key] ?? 3);

                        return (
                          <label key={`${article.slug}-score-${metric.id}`} className="blog-scorecard-row">
                            <span className="blog-scorecard-label">{metric.label}</span>
                            <input
                              type="range"
                              min={0}
                              max={5}
                              step={1}
                              value={score}
                              onChange={(event) => updateScoreMetric(metric.id, Number(event.target.value))}
                              aria-label={`${metric.label} readiness score`}
                            />
                            <div className="blog-scorecard-meta">
                              <small>{metric.prompt}</small>
                              <strong>{score}/5</strong>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="blog-scorecard-total">Readiness score: {scoreSummary.percent}% ({scoreSummary.label})</p>
                  </article>

                  <article className="blog-playbook-card">
                    <h3>{toolkit.templateTitle}</h3>
                    <ul className="blog-template-list">
                      {toolkit.templateFields.map((field, index) => (
                        <li key={`${article.slug}-template-${index}`}>{field}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="blog-playbook-card">
                    <h3>Mistakes to avoid</h3>
                    <ul className="blog-pitfalls">
                      {playbook.pitfalls.map((item, index) => (
                        <li key={`${article.slug}-pitfall-${index}`}>{item}</li>
                      ))}
                    </ul>
                    <p className="blog-success-signal">Success signal: {playbook.successSignal}</p>
                  </article>

                  <article className="blog-playbook-card">
                    <h3>People also ask</h3>
                    <div className="blog-faq-list">
                      {playbook.faq.map((item, index) => (
                        <details key={`${article.slug}-faq-${index}`} className="blog-faq-item" open={index === 0}>
                          <summary>{item.question}</summary>
                          <p>{item.answer}</p>
                        </details>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="blog-article-loading" aria-hidden="true">
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        )}
      </motion.article>
    </section>
  );
};

export default BlogArticlePage;
