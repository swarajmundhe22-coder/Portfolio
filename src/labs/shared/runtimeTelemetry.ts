const telemetryPreferenceKey = 'agon.telemetry-opt-in';

export type RuntimeIssueLevel = 'info' | 'warn' | 'error' | 'critical';

export interface RuntimeIssuePayload {
  lab: 'magnetic-blobs' | 'animated-list' | 'galaxy-field';
  category: 'webgl-context-loss' | 'shader-compilation' | 'out-of-memory' | 'runtime';
  level: RuntimeIssueLevel;
  message: string;
  extra?: Record<string, unknown>;
}

interface ParsedSentryDsn {
  dsn: string;
  projectId: string;
  publicKey: string;
  envelopeUrl: string;
}

const createEventId = (): string => {
  const alphabet = '0123456789abcdef';
  let eventId = '';
  for (let index = 0; index < 32; index += 1) {
    eventId += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return eventId;
};

const parseSentryDsn = (dsn: string): ParsedSentryDsn | null => {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, '').split('/')[0] ?? '';
    const publicKey = url.username;

    if (!projectId || !publicKey) {
      return null;
    }

    return {
      dsn,
      projectId,
      publicKey,
      envelopeUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`,
    };
  } catch {
    return null;
  }
};

const getSentryConfig = (): ParsedSentryDsn | null => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (typeof dsn !== 'string' || !dsn.trim()) {
    return null;
  }
  return parseSentryDsn(dsn.trim());
};

const toUserContext = (): Record<string, unknown> => {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    url: window.location.href,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: 'deviceMemory' in navigator ? navigator.deviceMemory : undefined,
    userAgent: navigator.userAgent,
  };
};

export const isTelemetryOptIn = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(telemetryPreferenceKey) === '1';
};

export const setTelemetryOptIn = (enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(telemetryPreferenceKey, enabled ? '1' : '0');
};

export const getTelemetryPreferenceKey = (): string => telemetryPreferenceKey;

const sendSentryEnvelope = async (
  payload: RuntimeIssuePayload,
  sentry: ParsedSentryDsn,
): Promise<void> => {
  const eventId = createEventId();
  const now = new Date().toISOString();

  const envelopeHeader = {
    event_id: eventId,
    sent_at: now,
    dsn: sentry.dsn,
    sdk: {
      name: 'agon-webgl-labs',
      version: '1.0.0',
    },
  };

  const eventItemHeader = {
    type: 'event',
  };

  const eventPayload = {
    event_id: eventId,
    timestamp: now,
    level: payload.level,
    logger: 'agon-labs-runtime',
    tags: {
      lab: payload.lab,
      category: payload.category,
    },
    message: payload.message,
    contexts: {
      user_environment: toUserContext(),
    },
    extra: {
      replayUrl: typeof window === 'undefined' ? '' : window.location.href,
      ...payload.extra,
    },
  };

  const envelope = `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(eventItemHeader)}\n${JSON.stringify(eventPayload)}`;

  await fetch(sentry.envelopeUrl, {
    method: 'POST',
    body: envelope,
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
    },
    keepalive: true,
    mode: 'cors',
  });
};

export const reportRuntimeIssue = async (payload: RuntimeIssuePayload): Promise<void> => {
  if (!isTelemetryOptIn()) {
    return;
  }

  const sentryConfig = getSentryConfig();
  if (!sentryConfig) {
    if (import.meta.env.DEV) {
      console.warn('[telemetry] VITE_SENTRY_DSN is not configured.', payload);
    }
    return;
  }

  try {
    await sendSentryEnvelope(payload, sentryConfig);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[telemetry] Failed to send runtime issue.', error);
    }
  }
};
