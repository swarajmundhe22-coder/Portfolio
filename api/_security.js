import crypto from 'node:crypto';
import { parseCookies, verifyAccessToken } from './_auth.js';

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const RATE_LIMIT_STORE = new Map();
const SUSPICIOUS_IP_STORE = new Map();

const DEFAULT_ALLOWED_ORIGINS = [
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'https://localhost:4173',
];

const parseAllowedOrigins = () => {
  const fromEnv = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv]);
};

const ALLOWED_ORIGINS = parseAllowedOrigins();

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export const getRequestIp = (req) => {
  const forwardedFor = toArray(req.headers['x-forwarded-for'])[0];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = toArray(req.headers['x-real-ip'])[0];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return 'unknown';
};

const parseBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

const sanitizeString = (value) =>
  value
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

export const sanitizePayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item));
  }

  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, sanitizePayload(value)]),
    );
  }

  if (typeof payload === 'string') {
    return sanitizeString(payload);
  }

  return payload;
};

export const securityEventLog = ({ severity = 'info', event, requestId, ipAddress, detail = {} }) => {
  const payload = {
    timestamp: new Date().toISOString(),
    severity,
    event,
    requestId,
    ipAddress,
    detail,
  };

  const rendered = JSON.stringify(payload);
  if (severity === 'error' || severity === 'critical') {
    console.error(rendered);
    return;
  }

  console.info(rendered);
};

const markSuspiciousActivity = (ipAddress, event) => {
  const current = SUSPICIOUS_IP_STORE.get(ipAddress) ?? {
    points: 0,
    firstSeenAt: Date.now(),
    blockedUntil: 0,
  };

  const now = Date.now();
  if (now - current.firstSeenAt > 20 * 60 * 1_000) {
    current.points = 0;
    current.firstSeenAt = now;
  }

  current.points += 1;
  if (current.points >= 12) {
    current.blockedUntil = now + 10 * 60 * 1_000;
  }

  SUSPICIOUS_IP_STORE.set(ipAddress, current);
  return {
    blockedUntil: current.blockedUntil,
    points: current.points,
    event,
  };
};

const setCorsHeaders = (req, res, allowedMethods) => {
  const requestOrigin = req.headers.origin;
  const originAllowed = typeof requestOrigin === 'string' && ALLOWED_ORIGINS.has(requestOrigin);

  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', `${allowedMethods.join(', ')}, OPTIONS`);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-CSRF-Token, X-Request-Id, X-Requested-With',
  );
};

const setSecurityHeaders = (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://worldtimeapi.org https://restcountries.com https://*.supabase.co",
      "form-action 'self'",
    ].join('; '),
  );

  const forwardedProto = toArray(req.headers['x-forwarded-proto'])[0];
  if (forwardedProto === 'https' || process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
};

const enforceRateLimit = ({ req, res, requestId, ipAddress, config, routeKey }) => {
  const rule = {
    windowMs: config?.windowMs ?? 60_000,
    max: config?.max ?? 80,
  };

  const suspicious = SUSPICIOUS_IP_STORE.get(ipAddress);
  if (suspicious && suspicious.blockedUntil > Date.now()) {
    const retryAfter = Math.ceil((suspicious.blockedUntil - Date.now()) / 1_000);
    res.setHeader('Retry-After', String(retryAfter));
    throw new HttpError(429, 'IP_TEMPORARILY_BLOCKED', 'Too many suspicious requests.');
  }

  const key = `${routeKey}:${ipAddress}`;
  const currentTime = Date.now();
  const current = RATE_LIMIT_STORE.get(key) ?? {
    count: 0,
    resetAt: currentTime + rule.windowMs,
  };

  if (currentTime >= current.resetAt) {
    current.count = 0;
    current.resetAt = currentTime + rule.windowMs;
  }

  current.count += 1;
  RATE_LIMIT_STORE.set(key, current);

  const remaining = Math.max(0, rule.max - current.count);
  res.setHeader('X-RateLimit-Limit', String(rule.max));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.floor(current.resetAt / 1_000)));

  if (current.count > rule.max) {
    const suspiciousState = markSuspiciousActivity(ipAddress, 'rate-limit-threshold-exceeded');
    securityEventLog({
      severity: suspiciousState.points > 10 ? 'critical' : 'warn',
      event: 'rate_limit_exceeded',
      requestId,
      ipAddress,
      detail: {
        routeKey,
        count: current.count,
        threshold: rule.max,
      },
    });

    const retryAfter = Math.ceil((current.resetAt - currentTime) / 1_000);
    res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
    throw new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded.');
  }
};

export const createSecureHandler = (config, handler) => {
  const effectiveConfig = {
    methods: config.methods ?? ['GET'],
    auth: config.auth ?? 'none',
    roles: config.roles ?? [],
    rateLimit: config.rateLimit ?? { windowMs: 60_000, max: 80 },
    csrf: Boolean(config.csrf),
    bodySchema: config.bodySchema,
    maxBodyBytes: config.maxBodyBytes ?? 100_000,
  };

  return async (req, res) => {
    const requestId = String(req.headers['x-request-id'] || crypto.randomUUID());
    const ipAddress = getRequestIp(req);
    const routeKey = req.url || req.headers['x-vercel-id'] || 'route';

    res.setHeader('X-Request-Id', requestId);
    setSecurityHeaders(req, res);
    setCorsHeaders(req, res, effectiveConfig.methods);

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    try {
      if (!effectiveConfig.methods.includes(req.method)) {
        throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
      }

      const contentLengthRaw = req.headers['content-length'];
      const contentLength = Number.parseInt(
        Array.isArray(contentLengthRaw) ? contentLengthRaw[0] : contentLengthRaw || '0',
        10,
      );
      if (Number.isFinite(contentLength) && contentLength > effectiveConfig.maxBodyBytes) {
        throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Payload exceeds allowed size.');
      }

      enforceRateLimit({
        req,
        res,
        requestId,
        ipAddress,
        config: effectiveConfig.rateLimit,
        routeKey,
      });

      const sanitizedBody = sanitizePayload(req.body || {});
      req.body = sanitizedBody;

      let validatedBody = sanitizedBody;
      if (effectiveConfig.bodySchema) {
        const parsed = effectiveConfig.bodySchema.safeParse(sanitizedBody);
        if (!parsed.success) {
          throw new HttpError(422, 'INPUT_VALIDATION_FAILED', parsed.error.issues[0]?.message || 'Invalid input.');
        }
        validatedBody = parsed.data;
      }

      let auth = null;
      const bearer = parseBearerToken(req.headers.authorization);
      if (bearer) {
        try {
          auth = await verifyAccessToken(bearer);
        } catch {
          throw new HttpError(401, 'INVALID_ACCESS_TOKEN', 'Authentication token is invalid or expired.');
        }
      }

      if (effectiveConfig.auth === 'required' && !auth) {
        throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication is required for this endpoint.');
      }

      if (effectiveConfig.roles.length > 0) {
        if (!auth || !effectiveConfig.roles.includes(auth.role)) {
          throw new HttpError(403, 'INSUFFICIENT_ROLE', 'Insufficient privileges for this operation.');
        }
      }

      if (effectiveConfig.csrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const cookies = parseCookies(req.headers.cookie || '');
        const csrfHeader = req.headers['x-csrf-token'];
        const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
        const csrfCookie = cookies.csrf_token;

        if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
          throw new HttpError(403, 'CSRF_VALIDATION_FAILED', 'CSRF token validation failed.');
        }
      }

      return await handler(req, res, {
        requestId,
        ipAddress,
        auth,
        body: validatedBody,
      });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const code = error instanceof HttpError ? error.code : 'INTERNAL_SERVER_ERROR';
      const message = error instanceof HttpError ? error.message : 'Unexpected server error.';

      if (!(error instanceof HttpError)) {
        securityEventLog({
          severity: 'error',
          event: 'unhandled_api_exception',
          requestId,
          ipAddress,
          detail: {
            routeKey,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }

      if (status === 401 || status === 403 || status === 429) {
        markSuspiciousActivity(ipAddress, code);
      }

      return res.status(status).json({
        error: {
          code,
          message,
          requestId,
        },
      });
    }
  };
};

export const getSecurityTelemetrySnapshot = () => ({
  rateLimitBuckets: RATE_LIMIT_STORE.size,
  suspiciousIpsTracked: SUSPICIOUS_IP_STORE.size,
});
