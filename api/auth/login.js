import { z } from 'zod';
import {
  clearFailedLoginAttempts,
  findUserByEmail,
  issueSessionTokens,
  registerFailedLoginAttempt,
  serializeCookie,
  verifyPassword,
  verifyTotp,
  getLoginAttemptStatus,
} from '../_auth.js';
import { createSecureHandler, securityEventLog } from '../_security.js';
import { authCookieBase } from './_shared.js';

const loginSchema = z.object({
  email: z.string().trim().email('A valid email address is required.'),
  password: z.string().min(1, 'Password is required.').max(128),
  mfaCode: z.string().trim().regex(/^\d{6}$/).optional(),
});

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  mfaEnabled: user.mfaEnabled,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
});

export default createSecureHandler(
  {
    methods: ['POST'],
    auth: 'none',
    csrf: false,
    bodySchema: loginSchema,
    rateLimit: {
      windowMs: 60_000,
      max: 10,
    },
    maxBodyBytes: 40_000,
  },
  async (req, res, { body, requestId, ipAddress }) => {
    const loginStatus = getLoginAttemptStatus(ipAddress);
    if (loginStatus.blocked) {
      securityEventLog({
        severity: 'warn',
        event: 'auth_login_blocked_ip',
        requestId,
        ipAddress,
        detail: {
          remainingMs: loginStatus.remainingMs,
        },
      });
      return res.status(429).json({
        error: {
          code: 'LOGIN_TEMPORARILY_BLOCKED',
          message: 'Too many failed attempts. Please try again later.',
          requestId,
        },
      });
    }

    const user = findUserByEmail(body.email);
    const passwordValid = user ? await verifyPassword(user, body.password) : false;

    if (!user || !passwordValid) {
      const failed = registerFailedLoginAttempt(ipAddress);
      securityEventLog({
        severity: failed.blockedUntil > Date.now() ? 'warn' : 'info',
        event: 'auth_login_failed',
        requestId,
        ipAddress,
        detail: {
          reason: 'invalid_credentials',
          attempts: failed.count,
        },
      });

      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect.',
          requestId,
        },
      });
    }

    if (user.mfaEnabled) {
      const hasValidMfaCode =
        Boolean(user.mfaSecret) &&
        Boolean(body.mfaCode) &&
        verifyTotp({ secret: user.mfaSecret, code: body.mfaCode });

      if (!hasValidMfaCode) {
        registerFailedLoginAttempt(ipAddress);
        securityEventLog({
          severity: 'warn',
          event: 'auth_login_failed_mfa',
          requestId,
          ipAddress,
          detail: {
            userId: user.id,
          },
        });

        return res.status(401).json({
          error: {
            code: 'MFA_REQUIRED',
            message: 'A valid MFA code is required.',
            requestId,
          },
        });
      }
    }

    clearFailedLoginAttempts(ipAddress);

    const tokens = await issueSessionTokens({
      user,
      ipAddress,
      userAgent: String(req.headers['user-agent'] || ''),
    });

    const cookieBase = authCookieBase(req);
    const cookieHeaders = [
      serializeCookie('refresh_token', tokens.refreshToken, {
        ...cookieBase,
        maxAge: Math.floor((14 * 24 * 60 * 60 * 1_000) / 1_000),
        httpOnly: true,
      }),
      serializeCookie('csrf_token', tokens.csrfToken, {
        ...cookieBase,
        maxAge: Math.floor((14 * 24 * 60 * 60 * 1_000) / 1_000),
        httpOnly: false,
      }),
    ];

    res.setHeader('Set-Cookie', cookieHeaders);

    securityEventLog({
      event: 'auth_login_success',
      requestId,
      ipAddress,
      detail: {
        userId: user.id,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });

    return res.status(200).json({
      accessToken: tokens.accessToken,
      user: toPublicUser(user),
      tokenType: 'Bearer',
      expiresInSeconds: 900,
    });
  },
);
