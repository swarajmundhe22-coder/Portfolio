import {
  parseCookies,
  rotateSessionTokens,
  serializeCookie,
} from '../_auth.js';
import { createSecureHandler, securityEventLog } from '../_security.js';
import { authCookieBase } from './_shared.js';

const refreshLifetimeSeconds = Math.floor((14 * 24 * 60 * 60 * 1_000) / 1_000);

export default createSecureHandler(
  {
    methods: ['POST'],
    auth: 'none',
    csrf: true,
    rateLimit: {
      windowMs: 60_000,
      max: 30,
    },
  },
  async (req, res, { requestId, ipAddress }) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const refreshToken = cookies.refresh_token;
    const csrfToken = cookies.csrf_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token cookie is required.',
          requestId,
        },
      });
    }

    try {
      const tokens = await rotateSessionTokens({
        refreshToken,
        csrfToken,
        ipAddress,
        userAgent: String(req.headers['user-agent'] || ''),
      });

      const cookieBase = authCookieBase(req);
      res.setHeader('Set-Cookie', [
        serializeCookie('refresh_token', tokens.refreshToken, {
          ...cookieBase,
          maxAge: refreshLifetimeSeconds,
          httpOnly: true,
        }),
        serializeCookie('csrf_token', tokens.csrfToken, {
          ...cookieBase,
          maxAge: refreshLifetimeSeconds,
          httpOnly: false,
        }),
      ]);

      securityEventLog({
        event: 'auth_refresh_success',
        requestId,
        ipAddress,
        detail: {
          sessionId: tokens.session.id,
        },
      });

      return res.status(200).json({
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresInSeconds: 900,
      });
    } catch (error) {
      securityEventLog({
        severity: 'warn',
        event: 'auth_refresh_failed',
        requestId,
        ipAddress,
        detail: {
          reason: error instanceof Error ? error.message : String(error),
        },
      });

      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid, expired, or revoked.',
          requestId,
        },
      });
    }
  },
);
