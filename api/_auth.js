import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_ISSUER = 'agon-agent-api';
const ACCESS_TOKEN_AUDIENCE = 'agon-agent-client';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1_000;
const MFA_TIME_STEP_SECONDS = 30;
const MFA_DIGITS = 6;

const usersByEmail = new Map();
const usersById = new Map();
const refreshSessionsByHash = new Map();
const failedLoginAttemptsByIp = new Map();

const textEncoder = new TextEncoder();
const accessTokenSecret = textEncoder.encode(
  process.env.JWT_ACCESS_SECRET || 'dev-only-access-secret-change-me-before-production',
);

if (process.env.NODE_ENV === 'production' && !process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET must be configured in production.');
}

const now = () => Date.now();

const hashToken = (token) =>
  crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

const randomToken = (size = 48) => crypto.randomBytes(size).toString('base64url');

const normalizeEmail = (value) => value.trim().toLowerCase();

const toUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  mfaEnabled: user.mfaEnabled,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
});

const recordFailedAttempt = (ipAddress) => {
  const key = ipAddress || 'unknown';
  const current = failedLoginAttemptsByIp.get(key) ?? { count: 0, firstSeenAt: now(), blockedUntil: 0 };
  const currentTime = now();

  if (current.blockedUntil > currentTime) {
    return current;
  }

  if (currentTime - current.firstSeenAt > 15 * 60 * 1_000) {
    current.count = 0;
    current.firstSeenAt = currentTime;
  }

  current.count += 1;
  if (current.count >= 8) {
    current.blockedUntil = currentTime + 10 * 60 * 1_000;
  }

  failedLoginAttemptsByIp.set(key, current);
  return current;
};

export const getLoginAttemptStatus = (ipAddress) => {
  const key = ipAddress || 'unknown';
  const current = failedLoginAttemptsByIp.get(key);
  if (!current) {
    return { blocked: false, remainingMs: 0, attempts: 0 };
  }

  const currentTime = now();
  if (current.blockedUntil <= currentTime) {
    return { blocked: false, remainingMs: 0, attempts: current.count };
  }

  return {
    blocked: true,
    remainingMs: Math.max(0, current.blockedUntil - currentTime),
    attempts: current.count,
  };
};

export const clearFailedLoginAttempts = (ipAddress) => {
  const key = ipAddress || 'unknown';
  failedLoginAttemptsByIp.delete(key);
};

const cleanupRefreshSessions = () => {
  const currentTime = now();
  for (const [hash, session] of refreshSessionsByHash.entries()) {
    if (session.expiresAt <= currentTime || session.revokedAt) {
      refreshSessionsByHash.delete(hash);
    }
  }
};

export const registerUser = async ({ email, password, name, role = 'viewer' }) => {
  const normalizedEmail = normalizeEmail(email);
  if (usersByEmail.has(normalizedEmail)) {
    throw new Error('EMAIL_ALREADY_REGISTERED');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: name.trim(),
    role,
    passwordHash,
    mfaEnabled: false,
    mfaSecret: null,
    pendingMfaSecret: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };

  usersByEmail.set(user.email, user);
  usersById.set(user.id, user);
  return toUserResponse(user);
};

export const findUserByEmail = (email) => usersByEmail.get(normalizeEmail(email)) ?? null;

export const findUserById = (id) => usersById.get(id) ?? null;

export const verifyPassword = async (user, password) => bcrypt.compare(password, user.passwordHash);

const signAccessToken = async (session) =>
  new SignJWT({
    sub: session.userId,
    role: session.role,
    sid: session.id,
    email: session.email,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ACCESS_TOKEN_ISSUER)
    .setAudience(ACCESS_TOKEN_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(accessTokenSecret);

export const verifyAccessToken = async (token) => {
  const { payload } = await jwtVerify(token, accessTokenSecret, {
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
  });

  return {
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
    sessionId: payload.sid,
  };
};

const createSession = async ({ user, ipAddress, userAgent, previousSessionId = null }) => {
  cleanupRefreshSessions();

  const refreshToken = randomToken(56);
  const csrfToken = randomToken(18);
  const session = {
    id: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: now(),
    expiresAt: now() + REFRESH_TOKEN_TTL_MS,
    rotatedFrom: previousSessionId,
    replacedBy: null,
    revokedAt: null,
    ipAddress,
    userAgent,
    csrfToken,
  };

  refreshSessionsByHash.set(hashToken(refreshToken), session);

  const accessToken = await signAccessToken(session);
  return {
    accessToken,
    refreshToken,
    csrfToken,
    session,
  };
};

export const issueSessionTokens = async ({ user, ipAddress, userAgent }) => {
  user.lastLoginAt = new Date().toISOString();
  return createSession({ user, ipAddress, userAgent });
};

export const rotateSessionTokens = async ({ refreshToken, csrfToken, ipAddress, userAgent }) => {
  cleanupRefreshSessions();

  const refreshHash = hashToken(refreshToken);
  const current = refreshSessionsByHash.get(refreshHash);
  if (!current || current.revokedAt || current.expiresAt <= now()) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  if (!csrfToken || current.csrfToken !== csrfToken) {
    throw new Error('CSRF_MISMATCH');
  }

  const user = findUserById(current.userId);
  if (!user) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  current.revokedAt = now();

  const next = await createSession({
    user,
    ipAddress,
    userAgent,
    previousSessionId: current.id,
  });
  current.replacedBy = next.session.id;

  return next;
};

export const revokeSession = ({ refreshToken }) => {
  const refreshHash = hashToken(refreshToken);
  const current = refreshSessionsByHash.get(refreshHash);
  if (current) {
    current.revokedAt = now();
  }
};

export const parseCookies = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, pair) => {
      const equalsIndex = pair.indexOf('=');
      if (equalsIndex <= 0) {
        return accumulator;
      }
      const key = decodeURIComponent(pair.slice(0, equalsIndex).trim());
      const value = decodeURIComponent(pair.slice(equalsIndex + 1).trim());
      accumulator[key] = value;
      return accumulator;
    }, {});
};

export const serializeCookie = (name, value, options = {}) => {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.httpOnly) {
    parts.push('HttpOnly');
  }
  if (options.secure) {
    parts.push('Secure');
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  return parts.join('; ');
};

export const mfaSecretForUser = (user) => user.mfaSecret ?? user.pendingMfaSecret;

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const encodeBase32 = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
};

const decodeBase32 = (value) => {
  const normalized = value.replace(/=+$/g, '').toUpperCase().replace(/\s+/g, '');
  let bits = 0;
  let current = 0;
  const bytes = [];

  for (const char of normalized) {
    const index = base32Alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('INVALID_MFA_SECRET');
    }

    current = (current << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

export const generateMfaSecret = () => encodeBase32(crypto.randomBytes(20));

const hotp = (secret, counter) => {
  const key = decodeBase32(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = binary % 10 ** MFA_DIGITS;
  return code.toString().padStart(MFA_DIGITS, '0');
};

export const verifyTotp = ({ secret, code, epochMs = now(), skew = 1 }) => {
  const normalized = String(code ?? '').trim();
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }

  const counter = Math.floor(epochMs / (MFA_TIME_STEP_SECONDS * 1_000));
  for (let offset = -skew; offset <= skew; offset += 1) {
    if (hotp(secret, counter + offset) === normalized) {
      return true;
    }
  }
  return false;
};

export const buildOtpAuthUri = ({ email, secret }) => {
  const issuer = 'Agon Portfolio';
  const label = `${issuer}:${email}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(MFA_DIGITS),
    period: String(MFA_TIME_STEP_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
};

export const assignPendingMfaSecret = (user, secret) => {
  user.pendingMfaSecret = secret;
};

export const enableMfaForUser = (user) => {
  user.mfaEnabled = true;
  user.mfaSecret = user.pendingMfaSecret || user.mfaSecret;
  user.pendingMfaSecret = null;
};

export const clearMfaSetup = (user) => {
  user.pendingMfaSecret = null;
};

export const setBootstrapAdmin = async () => {
  const email = process.env.SECURITY_BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.SECURITY_BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  if (findUserByEmail(email)) {
    return;
  }

  await registerUser({
    email,
    password,
    name: 'Bootstrap Admin',
    role: 'admin',
  });
};

void setBootstrapAdmin();

export const registerFailedLoginAttempt = (ipAddress) => recordFailedAttempt(ipAddress);

export const getAuthTelemetrySnapshot = () => ({
  registeredUsers: usersByEmail.size,
  activeRefreshSessions: refreshSessionsByHash.size,
  ipsWithFailedLogins: failedLoginAttemptsByIp.size,
});
