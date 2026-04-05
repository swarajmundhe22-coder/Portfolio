import {
  parseCookies,
  revokeSession,
  serializeCookie,
} from '../_auth.js';
import { createSecureHandler, securityEventLog } from '../_security.js';
import { authCookieBase } from './_shared.js';

export default createSecureHandler(
  {
    methods: ['POST'],
    auth: 'none',
    csrf: true,
    rateLimit: {
      windowMs: 60_000,
      max: 40,
    },
  },
  async (req, res, { requestId, ipAddress }) => {
    const cookies = parseCookies(req.headers.cookie || '');
    if (cookies.refresh_token) {
      revokeSession({ refreshToken: cookies.refresh_token });
    }

    const cookieBase = authCookieBase(req);
    res.setHeader('Set-Cookie', [
      serializeCookie('refresh_token', '', {
        ...cookieBase,
        maxAge: 0,
        httpOnly: true,
      }),
      serializeCookie('csrf_token', '', {
        ...cookieBase,
        maxAge: 0,
        httpOnly: false,
      }),
    ]);

    securityEventLog({
      event: 'auth_logout',
      requestId,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
    });
  },
);
