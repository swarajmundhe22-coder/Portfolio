const normalizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const hashString = (input: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

type CoverTheme =
  | 'infrastructure'
  | 'motion'
  | 'ci'
  | 'contact'
  | 'responsive'
  | 'accessibility'
  | 'incident'
  | 'editorial';

interface CoverCopy {
  kicker: string;
  headline: string;
  subline: string;
}

const coverThemeBySlug: Record<string, CoverTheme> = {
  'why-react-threejs-real-time-simulation-for-infrastructure-intelligence': 'infrastructure',
  'frame-matching-a-portfolio-from-video-only': 'motion',
  'design-drift-is-a-ci-problem-not-a-qa-problem': 'ci',
  'design-drift-is-a-ci-problem': 'ci',
  'building-reliable-contact-pipelines-with-supabase': 'contact',
  'motion-values-that-feel-premium-at-60-fps': 'motion',
  'responsive-qa-checklist-for-320-to-1440-widths': 'responsive',
  'accessibility-contrast-audits-without-guesswork': 'accessibility',
  'debugging-frontend-incidents-before-users-notice': 'incident',
};

const coverCopyBySlug: Record<string, CoverCopy> = {
  'why-react-threejs-real-time-simulation-for-infrastructure-intelligence': {
    kicker: 'INFRASTRUCTURE INTELLIGENCE',
    headline: 'REAL-TIME RISK MAP',
    subline: 'Forecast decay before failure.',
  },
  'frame-matching-a-portfolio-from-video-only': {
    kicker: 'FRONTEND MOTION SYSTEM',
    headline: 'FRAME TO PROD',
    subline: 'Match timing, not just pixels.',
  },
  'design-drift-is-a-ci-problem-not-a-qa-problem': {
    kicker: 'VISUAL QA AUTOMATION',
    headline: 'DRIFT STOPS IN CI',
    subline: 'Block regressions before merge.',
  },
  'design-drift-is-a-ci-problem': {
    kicker: 'VISUAL QA AUTOMATION',
    headline: 'DRIFT STOPS IN CI',
    subline: 'Block regressions before merge.',
  },
  'building-reliable-contact-pipelines-with-supabase': {
    kicker: 'LEAD PIPELINE RELIABILITY',
    headline: 'NO FORM LEFT BEHIND',
    subline: 'Spam-safe, schema-safe, revenue-safe.',
  },
  'motion-values-that-feel-premium-at-60-fps': {
    kicker: 'PERFORMANCE MOTION',
    headline: 'SMOOTH AT 60 FPS',
    subline: 'Cinematic feel without lag.',
  },
  'responsive-qa-checklist-for-320-to-1440-widths': {
    kicker: 'RESPONSIVE RELEASE GATE',
    headline: '320 TO 1440 SAFE',
    subline: 'Catch breakpoints users feel.',
  },
  'accessibility-contrast-audits-without-guesswork': {
    kicker: 'ACCESSIBILITY ENFORCEMENT',
    headline: 'CONTRAST WITH PROOF',
    subline: 'Audit states, themes, and content.',
  },
  'debugging-frontend-incidents-before-users-notice': {
    kicker: 'INCIDENT RESPONSE PLAYBOOK',
    headline: 'FIX BEFORE USERS REPORT',
    subline: 'Detect, triage, recover fast.',
  },
};

const escapeSvgText = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildFallbackCopy = (title: string): CoverCopy => {
  const words = title.split(/\s+/).filter(Boolean);
  const headline = words.slice(0, 3).join(' ').toUpperCase() || 'PRODUCT SYSTEM INSIGHT';
  return {
    kicker: 'ENGINEERING NOTE',
    headline,
    subline: 'Practical patterns from production delivery.',
  };
};

const toInitials = (title: string): string =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

const buildThemePalette = (theme: CoverTheme, seed: number): { bgA: string; bgB: string; bgC: string; accent: string; accentSoft: string; highlight: string } => {
  if (theme === 'infrastructure') {
    return { bgA: '#0a1420', bgB: '#1a3a60', bgC: '#0f2847', accent: '#ff9f2e', accentSoft: '#3fd5ff', highlight: '#ffb85c' };
  }

  if (theme === 'motion') {
    return { bgA: '#140a2a', bgB: '#3d1f82', bgC: '#2a1a5a', accent: '#ff5ab0', accentSoft: '#62d2ff', highlight: '#ff9dd9' };
  }

  if (theme === 'ci') {
    return { bgA: '#0d1a08', bgB: '#2a7a1f', bgC: '#1a4a12', accent: '#e8ff4d', accentSoft: '#48f7b2', highlight: '#ffff66' };
  }

  if (theme === 'contact') {
    return { bgA: '#2a0f1a', bgB: '#6b1f50', bgC: '#4a1a35', accent: '#ffa964', accentSoft: '#6de7ff', highlight: '#ffcd8d' };
  }

  if (theme === 'responsive') {
    return { bgA: '#081a30', bgB: '#1f5a8f', bgC: '#0d3555', accent: '#8dd3ff', accentSoft: '#9cffc2', highlight: '#b8e8ff' };
  }

  if (theme === 'accessibility') {
    return { bgA: '#1a1208', bgB: '#8b5a1f', bgC: '#5a3a1a', accent: '#ffea55', accentSoft: '#ffffff', highlight: '#fff88a' };
  }

  if (theme === 'incident') {
    return { bgA: '#2a0a0f', bgB: '#8b1a2a', bgC: '#5a1a25', accent: '#ff6b7d', accentSoft: '#ffd0d5', highlight: '#ff99aa' };
  }

  const hue = seed % 360;
  return {
    bgA: `hsl(${hue} 60% 15%)`,
    bgB: `hsl(${(hue + 42) % 360} 65% 32%)`,
    bgC: `hsl(${(hue + 20) % 360} 62% 24%)`,
    accent: `hsl(${(hue + 180) % 360} 95% 60%)`,
    accentSoft: `hsl(${(hue + 230) % 360} 75% 80%)`,
    highlight: `hsl(${(hue + 160) % 360} 100% 68%)`,
  };
};

const buildThemeArtwork = (theme: CoverTheme, seed: number, accent: string, accentSoft: string, highlight: string): string => {
  const shift = seed % 140;

  if (theme === 'infrastructure') {
    return `<g>
      <!-- Deep lighting layers -->
      <rect x='0' y='200' width='1200' height='400' fill='rgba(15,50,90,0.4)' opacity='0.5'/>
      
      <!-- Holographic infrastructure grid -->
      <g stroke='${accentSoft}' stroke-width='2' opacity='0.25'>
        <line x1='140' y1='240' x2='1060' y2='240'/>
        <line x1='140' y1='280' x2='1060' y2='280'/>
        <line x1='140' y1='320' x2='1060' y2='320'/>
        <line x1='140' y1='360' x2='1060' y2='360'/>
        <line x1='140' y1='240' x2='140' y2='360'/>
        <line x1='280' y1='240' x2='280' y2='360'/>
        <line x1='420' y1='240' x2='420' y2='360'/>
        <line x1='560' y1='240' x2='560' y2='360'/>
        <line x1='700' y1='240' x2='700' y2='360'/>
        <line x1='840' y1='240' x2='840' y2='360'/>
        <line x1='980' y1='240' x2='980' y2='360'/>
        <line x1='1060' y1='240' x2='1060' y2='360'/>
      </g>

      <!-- Main pipeline pipes with glow effect -->
      <g stroke='${accent}' stroke-width='14' opacity='0.82' stroke-linecap='round'>
        <path d='M 120 300 L 520 300' filter='url(#glow)'/>
        <path d='M 580 300 L 1080 300' filter='url(#glow)'/>
      </g>
      <g stroke='${highlight}' stroke-width='8' opacity='0.6'>
        <path d='M 120 300 L 520 300'/>
        <path d='M 580 300 L 1080 300'/>
      </g>

      <!-- Side rails -->
      <g stroke='${accentSoft}' stroke-width='5' opacity='0.4'>
        <line x1='120' y1='265' x2='1080' y2='265'/>
        <line x1='120' y1='335' x2='1080' y2='335'/>
      </g>

      <!-- Data flow nodes -->
      <g fill='${accent}' opacity='0.9' filter='url(#glow)'>
        <circle cx='200' cy='300' r='12'/>
        <circle cx='420' cy='300' r='12'/>
        <circle cx='780' cy='300' r='12'/>
        <circle cx='1000' cy='300' r='12'/>
      </g>

      <!-- Pulse indicators -->
      <g fill='${highlight}' opacity='0.7'>
        <circle cx='200' cy='300' r='7'/>
        <circle cx='1000' cy='300' r='7'/>
      </g>

      <!-- Status blocks with depth -->
      <rect x='800' y='160' width='360' height='140' rx='16' fill='rgba(5,15,30,0.7)' stroke='rgba(255,255,255,0.3)' stroke-width='2' filter='url(#shadow)'/>
      <g fill='${accent}' opacity='0.92'>
        <rect x='820' y='178' width='14' height='14' rx='3'/>
        <rect x='820' y='210' width='14' height='14' rx='3'/>
        <rect x='820' y='242' width='14' height='14' rx='3'/>
      </g>
      <g fill='rgba(255,255,255,0.85)' font-family='Inter, Segoe UI, monospace' font-size='13' font-weight='600' letter-spacing='0.02em'>
        <text x='844' y='187'>LIVE</text>
        <text x='844' y='219'>READY</text>
        <text x='844' y='251'>SAFE</text>
      </g>

      <!-- Performance metrics -->
      <g fill='${highlight}' opacity='0.6'>
        <rect x='820' y='178' width='310' height='4' rx='2'/>
        <rect x='820' y='210' width='285' height='4' rx='2'/>
        <rect x='820' y='242' width='298' height='4' rx='2'/>
      </g>
    </g>`;
  }

  if (theme === 'motion') {
    return `<g>
      <!-- Dynamic flow layers -->
      <rect x='0' y='0' width='1200' height='640' fill='rgba(80,20,120,0.15)'/>

      <!-- Primary motion curves with cinematic blur -->
      <path d='M -60 ${480 - shift * 0.4} Q 300 160, 600 340 T 1280 200' 
            fill='none' stroke='${highlight}' stroke-width='24' opacity='0.25' stroke-linecap='round'/>
      
      <path d='M -60 ${480 - shift * 0.35} Q 300 160, 600 340 T 1280 200' 
            fill='none' stroke='${accent}' stroke-width='14' opacity='0.88' stroke-linecap='round' filter='url(#glow)'/>
      
      <path d='M -60 ${480 - shift * 0.3} Q 300 160, 600 340 T 1280 200' 
            fill='none' stroke='${accentSoft}' stroke-width='6' opacity='0.72' stroke-linecap='round'/>

      <!-- Accent secondary curves -->
      <path d='M -40 ${520 - shift * 0.25} Q 280 240, 620 400 T 1260 320' 
            fill='none' stroke='${highlight}' stroke-width='8' opacity='0.5' stroke-linecap='round'/>

      <!-- Focal point circles with motion effect -->
      <g filter='url(#glow)'>
        <circle cx='320' cy='250' r='140' fill='none' stroke='${accent}' stroke-width='3' opacity='0.4'/>
        <circle cx='320' cy='250' r='100' fill='none' stroke='${accent}' stroke-width='6' opacity='0.65'/>
        <circle cx='320' cy='250' r='48' fill='${accent}' opacity='0.8'/>
        
        <circle cx='800' cy='360' r='160' fill='none' stroke='${highlight}' stroke-width='2' opacity='0.3'/>
        <circle cx='800' cy='360' r='110' fill='none' stroke='${highlight}' stroke-width='5' opacity='0.6'/>
        <circle cx='800' cy='360' r='50' fill='${highlight}' opacity='0.7'/>
      </g>

      <!-- Motion trails -->
      <g stroke='${accentSoft}' stroke-width='3' opacity='0.4' stroke-dasharray='4,6'>
        <path d='M 300 200 L 380 280'/>
        <path d='M 900 300 L 980 420'/>
      </g>
    </g>`;
  }

  if (theme === 'ci') {
    return `<g>
      <!-- CI pipeline stages -->
      <defs>
        <linearGradient id='ciGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stop-color='${highlight}' stop-opacity='0.9'/>
          <stop offset='100%' stop-color='${accent}' stop-opacity='0.6'/>
        </linearGradient>
      </defs>

      <!-- Background grid effect -->
      <rect x='0' y='140' width='1200' height='360' fill='rgba(50,100,30,0.2)'/>

      <!-- Stage boxes with depth -->
      <g filter='url(#shadow)'>
        <rect x='90' y='200' width='200' height='240' rx='16' fill='rgba(0,0,0,0.5)' stroke='${accent}' stroke-width='3' opacity='0.92'/>
        <rect x='340' y='200' width='200' height='240' rx='16' fill='rgba(0,0,0,0.5)' stroke='${accent}' stroke-width='3' opacity='0.85'/>
        <rect x='590' y='200' width='200' height='240' rx='16' fill='rgba(0,0,0,0.5)' stroke='${highlight}' stroke-width='3' opacity='0.9'/>
        <rect x='840' y='200' width='200' height='240' rx='16' fill='rgba(0,0,0,0.5)' stroke='${accent}' stroke-width='3' opacity='0.85'/>
      </g>

      <!-- Flow connectors with glow -->
      <g stroke='${accentSoft}' stroke-width='4' fill='none' opacity='0.7' stroke-linecap='round' filter='url(#glow)'>
        <path d='M 290 320 L 340 320'/>
        <path d='M 540 320 L 590 320'/>
        <path d='M 790 320 L 840 320'/>
      </g>

      <!-- Checkmark indicators -->
      <g stroke='${highlight}' stroke-width='6' fill='none' stroke-linecap='round' opacity='0.9' filter='url(#glow)'>
        <path d='M 145 300 L 160 320 L 185 290'/>
        <path d='M 395 300 L 410 320 L 435 290'/>
      </g>

      <!-- Stage labels -->
      <g fill='${accent}' font-family='Inter, Segoe UI, monospace' font-size='14' font-weight='700' letter-spacing='0.1em' opacity='0.95'>
        <text x='190' y='360' text-anchor='middle'>BUILD</text>
        <text x='440' y='360' text-anchor='middle'>TEST</text>
        <text x='690' y='360' text-anchor='middle'>DEPLOY</text>
        <text x='940' y='360' text-anchor='middle'>LIVE</text>
      </g>

      <!-- Success indicator bar -->
      <rect x='90' y='470' width='950' height='8' rx='4' fill='rgba(0,0,0,0.4)'/>
      <rect x='90' y='470' width='${760 + (seed % 190)}' height='8' rx='4' fill='url(#ciGrad)' filter='url(#glow)' opacity='0.9'/>
    </g>`;
  }

  if (theme === 'contact') {
    return `<g>
      <!-- Contact funnel visualization -->
      <defs>
        <linearGradient id='funnelGrad' x1='50%' y1='0%' x2='50%' y2='100%'>
          <stop offset='0%' stop-color='${accent}' stop-opacity='0.8'/>
          <stop offset='100%' stop-color='${highlight}' stop-opacity='0.6'/>
        </linearGradient>
      </defs>

      <!-- Depth shadow -->
      <rect x='0' y='200' width='1200' height='300' fill='rgba(30,10,20,0.4)' opacity='0.5'/>

      <!-- Funnel stages with glow -->
      <g filter='url(#glow)'>
        <polygon points='280,180 920,180 980,280 220,280' fill='url(#funnelGrad)' opacity='0.85'/>
        <polygon points='300,300 900,300 880,400 320,400' fill='${accent}' opacity='0.7'/>
        <polygon points='380,420 820,420 760,510 440,510' fill='${highlight}' opacity='0.6'/>
      </g>

      <!-- Connection lines -->
      <g stroke='${accentSoft}' stroke-width='3' opacity='0.5' stroke-dasharray='6,4'>
        <line x1='600' y1='280' x2='600' y2='300'/>
        <line x1='600' y1='400' x2='600' y2='420'/>
      </g>

      <!-- Stage count indicators -->
      <g fill='rgba(255,255,255,0.9)' font-family='Inter, Segoe UI, monospace' font-size='18' font-weight='700' text-anchor='middle'>
        <text x='600' y='240' filter='url(#glow)'>1240 LEADS</text>
        <text x='600' y='360'>420 QUALIFIED</text>
        <text x='600' y='465'>98 CONVERTED</text>
      </g>

      <!-- Conversion rate display -->
      <rect x='820' y='180' width='280' height='180' rx='14' fill='rgba(10,5,15,0.8)' stroke='${highlight}' stroke-width='2' filter='url(#shadow)'/>
      <text x='960' y='250' font-family='Inter, Segoe UI, monospace' font-size='48' font-weight='800' fill='${highlight}' text-anchor='middle' filter='url(#glow)'>7.9%</text>
      <text x='960' y='295' font-family='Segoe UI, Inter' font-size='14' fill='${accentSoft}' text-anchor='middle' opacity='0.9'>CONVERSION</text>
      <text x='960' y='315' font-family='Segoe UI, Inter' font-size='14' fill='${accentSoft}' text-anchor='middle' opacity='0.9'>RATE</text>
    </g>`;
  }

  if (theme === 'responsive') {
    return `<g>
      <!-- Responsive breakpoint visualization -->
      <!-- Mobile -->
      <g filter='url(#shadow)'>
        <rect x='120' y='100' width='240' height='440' rx='20' fill='rgba(10,15,35,0.8)' stroke='${highlight}' stroke-width='3' opacity='0.95'/>
        <rect x='135' y='125' width='210' height='360' rx='12' fill='rgba(20,40,80,0.5)' stroke='rgba(255,255,255,0.3)' stroke-width='1'/>
        <g fill='${accent}' opacity='0.8'>
          <rect x='140' y='145' width='200' height='8' rx='4'/>
          <rect x='140' y='165' width='185' height='8' rx='4'/>
          <rect x='140' y='185' width='195' height='8' rx='4'/>
          <rect x='140' y='210' width='200' height='60' rx='4' fill='${highlight}' opacity='0.7'/>
        </g>
      </g>

      <!-- Tablet -->
      <g filter='url(#shadow)'>
        <rect x='420' y='80' width='360' height='480' rx='24' fill='rgba(10,15,35,0.85)' stroke='${accentSoft}' stroke-width='3' opacity='0.92'/>
        <rect x='435' y='105' width='330' height='400' rx='14' fill='rgba(20,40,80,0.5)' stroke='rgba(255,255,255,0.25)' stroke-width='1'/>
        <g fill='${accent}' opacity='0.75'>
          <rect x='445' y='130' width='310' height='10' rx='5'/>
          <rect x='445' y='160' width='290' height='10' rx='5'/>
          <rect x='445' y='190' width='310' height='10' rx='5'/>
          <rect x='445' y='230' width='300' height='90' rx='5' fill='${highlight}' opacity='0.65'/>
        </g>
      </g>

      <!-- Desktop -->
      <g filter='url(#shadow)'>
        <rect x='840' y='60' width='320' height='520' rx='20' fill='rgba(10,15,35,0.9)' stroke='${accentSoft}' stroke-width='3' opacity='0.95'/>
        <rect x='850' y='80' width='300' height='440' rx='12' fill='rgba(20,40,80,0.45)' stroke='rgba(255,255,255,0.2)' stroke-width='1'/>
        <g fill='${accent}' opacity='0.8' font-family='Inter, Segoe UI, monospace' font-size='12'>
          <rect x='860' y='100' width='280' height='8' rx='4'/>
          <rect x='860' y='125' width='260' height='8' rx='4'/>
          <rect x='860' y='150' width='280' height='8' rx='4'/>
          <rect x='860' y='180' width='270' height='80' rx='4' fill='${highlight}' opacity='0.6'/>
        </g>
      </g>

      <!-- Connection indicators -->
      <g stroke='${accentSoft}' stroke-width='2' opacity='0.4' stroke-dasharray='3,3'>
        <path d='M 360 300 L 420 300'/>
        <path d='M 780 260 L 840 280'/>
      </g>

      <!-- Responsive label -->
      <text x='600' y='620' font-family='Inter, Segoe UI' font-size='16' font-weight='700' fill='${highlight}' text-anchor='middle' opacity='0.85'>FULLY RESPONSIVE ACROSS ALL SIZES</text>
    </g>`;
  }

  if (theme === 'accessibility') {
    return `<g>
      <!-- WCAG compliance target -->
      <defs>
        <radialGradient id='a11yGrad' cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stop-color='${highlight}' stop-opacity='0.3'/>
          <stop offset='100%' stop-color='${accent}' stop-opacity='0.05'/>
        </radialGradient>
      </defs>

      <!-- Concentric circles representing accessibility levels -->
      <circle cx='380' cy='320' r='240' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/>
      <circle cx='380' cy='320' r='180' fill='url(#a11yGrad)' opacity='0.6'/>
      <circle cx='380' cy='320' r='180' fill='none' stroke='${accentSoft}' stroke-width='3' opacity='0.5'/>
      
      <circle cx='380' cy='320' r='120' fill='none' stroke='${accent}' stroke-width='4' opacity='0.8' filter='url(#glow)'/>
      <circle cx='380' cy='320' r='60' fill='${highlight}' opacity='0.85' filter='url(#glow)'/>

      <!-- WCAG AA indicator -->
      <circle cx='380' cy='320' r='35' fill='rgba(0,0,0,0.6)' stroke='${accentSoft}' stroke-width='2'/>
      <text x='380' y='332' font-family='Inter, Segoe UI, monospace' font-size='22' font-weight='800' fill='${accentSoft}' text-anchor='middle'>AA</text>

      <!-- Accessibility indicators on right -->
      <g>
        <rect x='700' y='160' width='420' height='320' rx='16' fill='rgba(5,10,20,0.8)' stroke='${highlight}' stroke-width='2' filter='url(#shadow)'/>
        
        <!-- Contrast check -->
        <g opacity='0.95'>
          <circle cx='730' cy='210' r='8' fill='${accent}'/>
          <text x='760' y='218' font-family='Segoe UI, Inter' font-size='14' font-weight='600' fill='rgba(255,255,255,0.95)'>4.5:1 Contrast</text>
          <text x='760' y='237' font-family='Segoe UI, Inter' font-size='12' fill='${accentSoft}' opacity='0.8'>WCAG AA Pass</text>
        </g>

        <!-- Focus visible -->
        <g opacity='0.95' transform='translate(0 70)'>
          <circle cx='730' cy='210' r='8' fill='${highlight}'/>
          <text x='760' y='218' font-family='Segoe UI, Inter' font-size='14' font-weight='600' fill='rgba(255,255,255,0.95)'>Focus Visible</text>
          <text x='760' y='237' font-family='Segoe UI, Inter' font-size='12' fill='${accentSoft}' opacity='0.8'>Keyboard Nav</text>
        </g>

        <!-- ARIA labels -->
        <g opacity='0.95' transform='translate(0 140)'>
          <circle cx='730' cy='210' r='8' fill='${accent}'/>
          <text x='760' y='218' font-family='Segoe UI, Inter' font-size='14' font-weight='600' fill='rgba(255,255,255,0.95)'>ARIA Labels</text>
          <text x='760' y='237' font-family='Segoe UI, Inter' font-size='12' fill='${accentSoft}' opacity='0.8'>Screen Reader Ready</text>
        </g>
      </g>
    </g>`;
  }

  if (theme === 'incident') {
    return `<g>
      <!-- Incident response intensity visualization -->
      <!-- Alert waves -->
      <g fill='none' stroke='${highlight}' opacity='0.4' stroke-width='2' filter='url(#glow)'>
        <circle cx='600' cy='320' r='180' opacity='0.7'/>
        <circle cx='600' cy='320' r='280' opacity='0.4'/>
      </g>
      <g fill='none' stroke='${accent}' opacity='0.6' stroke-width='3' filter='url(#glow)'>
        <circle cx='600' cy='320' r='110'/>
      </g>

      <!-- Central alert -->
      <circle cx='600' cy='320' r='60' fill='${highlight}' opacity='0.9' filter='url(#glow)'/>
      <text x='600' y='340' font-family='Inter, Segoe UI, monospace' font-size='32' font-weight='800' fill='rgba(8,12,20,0.95)' text-anchor='middle'>!</text>

      <!-- Recovery timeline -->
      <g>
        <!-- Timeline bar -->
        <rect x='120' y='520' width='960' height='6' rx='3' fill='rgba(0,0,0,0.5)'/>
        
        <!-- Detection point -->
        <circle cx='180' cy='523' r='12' fill='${accent}' filter='url(#glow)'/>
        <text x='180' y='565' font-family='Segoe UI, Inter, monospace' font-size='12' font-weight='600' fill='${accent}' text-anchor='middle'>DETECT</text>

        <!-- Triage point -->
        <circle cx='420' cy='523' r='12' fill='${highlight}' filter='url(#glow)'/>
        <text x='420' y='565' font-family='Segoe UI, Inter, monospace' font-size='12' font-weight='600' fill='${highlight}' text-anchor='middle'>TRIAGE</text>

        <!-- Mitigation point -->
        <circle cx='660' cy='523' r='12' fill='${accentSoft}' filter='url(#glow)'/>
        <text x='660' y='565' font-family='Segoe UI, Inter, monospace' font-size='12' font-weight='600' fill='${accentSoft}' text-anchor='middle'>MITIGATE</text>

        <!-- Recovery point -->
        <circle cx='900' cy='523' r='12' fill='${accent}' filter='url(#glow)'/>
        <text x='900' y='565' font-family='Segoe UI, Inter, monospace' font-size='12' font-weight='600' fill='${accent}' text-anchor='middle'>RECOVER</text>
      </g>

      <!-- Status indicators -->
      <g fill='rgba(255,255,255,0.85)' font-family='Inter, Segoe UI, monospace' font-size='13' font-weight='600'>
        <text x='180' y='465' text-anchor='middle'>2m 14s</text>
        <text x='420' y='465' text-anchor='middle'>3m 47s</text>
        <text x='660' y='465' text-anchor='middle'>12m 30s</text>
        <text x='900' y='465' text-anchor='middle'>28m 16s</text>
      </g>
    </g>`;
  }

  return `<g>
    <circle cx='280' cy='214' r='200' fill='none' stroke='${highlight}' stroke-width='2' opacity='0.3'/>
    <circle cx='280' cy='214' r='260' fill='none' stroke='${accent}' stroke-width='1' opacity='0.15'/>
    <circle cx='910' cy='404' r='260' fill='none' stroke='${accentSoft}' stroke-width='2' opacity='0.2'/>
    <path d='M -20 420 C 240 290 440 480 700 360 C 910 260 1100 290 1260 210' fill='none' stroke='${accent}' stroke-width='12' opacity='0.7' filter='url(#glow)' stroke-linecap='round'/>
    <path d='M -20 470 C 240 340 440 520 700 412 C 920 322 1110 348 1260 286' fill='none' stroke='${highlight}' stroke-width='6' opacity='0.6' stroke-linecap='round'/>
  </g>`;
};

const buildGeneratedCover = (seedSource: string): string => {
  const seed = hashString(seedSource || 'blog-cover');
  const [normalizedSlug, rawTitle] = seedSource.split('|');
  const title = rawTitle || 'Blog Insight';
  const theme = coverThemeBySlug[normalizedSlug] ?? 'editorial';
  const copy = coverCopyBySlug[normalizedSlug] ?? buildFallbackCopy(title);
  const palette = buildThemePalette(theme, seed);
  const initials = toInitials(title) || 'BLG';
  const shift = seed % 160;
  const art = buildThemeArtwork(theme, seed, palette.accent, palette.accentSoft, palette.highlight);
  const headerOffset = 86 + (seed % 24);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 640' preserveAspectRatio='xMidYMid slice'>
    <defs>
      <!-- Primary gradient -->
      <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${palette.bgA}'/>
        <stop offset='50%' stop-color='${palette.bgC}'/>
        <stop offset='100%' stop-color='${palette.bgB}'/>
      </linearGradient>

      <!-- Enhanced vignette with radial falloff -->
      <radialGradient id='vignette' cx='50%' cy='35%' r='75%'>
        <stop offset='0%' stop-color='rgba(255,255,255,0.12)'/>
        <stop offset='60%' stop-color='rgba(255,255,255,0.02)'/>
        <stop offset='100%' stop-color='rgba(0,0,0,0.58)'/>
      </radialGradient>

      <!-- Glow filter for cinematic effect -->
      <filter id='glow' x='-50%' y='-50%' width='200%' height='200%'>
        <feGaussianBlur stdDeviation='3' result='coloredBlur'/>
        <feMerge>
          <feMergeNode in='coloredBlur'/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>

      <!-- Strong glow for highlights -->
      <filter id='strongGlow' x='-80%' y='-80%' width='260%' height='260%'>
        <feGaussianBlur stdDeviation='6' result='coloredBlur'/>
        <feMerge>
          <feMergeNode in='coloredBlur'/>
          <feMergeNode in='coloredBlur'/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>

      <!-- Drop shadow for depth -->
      <filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'>
        <feDropShadow dx='0' dy='8' stdDeviation='6' flood-opacity='0.6' flood-color='rgba(0,0,0,0.8)'/>
      </filter>

      <!-- Subtle blur -->
      <filter id='blur'>
        <feGaussianBlur stdDeviation='2'/>
      </filter>
    </defs>

    <!-- Base gradient background -->
    <rect width='1200' height='640' fill='url(#g)'/>

    <!-- Vignette overlay -->
    <rect width='1200' height='640' fill='url(#vignette)'/>

    <!-- Additional depth layer -->
    <rect width='1200' height='640' fill='rgba(0,0,0,0.08)'/>

    <!-- Artwork with glow -->
    ${art}

    <!-- Content card with enhanced depth -->
    <g filter='url(#shadow)'>
      <rect x='48' y='${headerOffset}' width='764' height='188' rx='18' fill='rgba(4,8,16,0.85)' stroke='rgba(255,255,255,0.28)' stroke-width='1.5'/>
    </g>

    <!-- Accent bar behind text -->
    <rect x='48' y='${headerOffset}' width='8' height='188' rx='4' fill='${palette.highlight}' opacity='0.9'/>

    <!-- Kicker badge -->
    <g>
      <rect x='64' y='${headerOffset + 18}' width='280' height='32' rx='10' fill='${palette.accent}' opacity='0.95'/>
      <text x='76' y='${headerOffset + 40}' font-family='Segoe UI, Inter, Arial, sans-serif' font-size='15' font-weight='800' fill='rgba(8,16,30,0.95)' letter-spacing='0.12em'>${escapeSvgText(copy.kicker)}</text>
    </g>

    <!-- Headline with cinematic weight -->
    <text x='64' y='${headerOffset + 96}' font-family='Segoe UI, Inter, Arial, sans-serif' font-size='58' font-weight='900' fill='white' letter-spacing='-0.01em' text-decoration='none'>${escapeSvgText(copy.headline)}</text>

    <!-- Subline with accent color -->
    <text x='64' y='${headerOffset + 140}' font-family='Segoe UI, Inter, Arial, sans-serif' font-size='22' font-weight='600' fill='${palette.highlight}' opacity='0.98'>${escapeSvgText(copy.subline)}</text>

    <!-- Accent underline -->
    <rect x='64' y='${headerOffset + 152}' width='480' height='5' rx='2.5' fill='${palette.highlight}' opacity='0.85'/>

    <!-- Corner badge with initials -->
    <g transform='translate(${80 + (shift % 220)} 74)' filter='url(#strongGlow)'>
      <rect width='148' height='62' rx='14' fill='rgba(5,9,16,0.65)' stroke='${palette.highlight}' stroke-width='2'/>
      <text x='74' y='42' text-anchor='middle' font-family='Inter, Segoe UI, Arial, sans-serif' font-size='32' font-weight='800' fill='${palette.highlight}'>${initials}</text>
    </g>

    <!-- Subtle geometric accents -->
    <g opacity='0.15' fill='none' stroke='${palette.accent}' stroke-width='1'>
      <circle cx='1080' cy='80' r='120'/>
      <circle cx='120' cy='560' r='140'/>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const resolveBlogCover = (slug: string, title: string, index = 0): string => {
  const normalized = normalizeSlug(slug || title || `post-${index + 1}`);
  return buildGeneratedCover(`${normalized}|${title}|${index}`);
};

export const buildBlogCoverSet = (imageUrl: string): string => {
  if (imageUrl.startsWith('data:image/svg+xml')) {
    return `${imageUrl} 1x`;
  }

  if (imageUrl.endsWith('.svg')) {
    return `${imageUrl} 1x`;
  }

  return `${imageUrl} 1x, ${imageUrl} 2x`;
};

export const toBlogSlug = normalizeSlug;
