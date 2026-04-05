import { z } from 'zod';
import {
  enableMfaForUser,
  findUserById,
  mfaSecretForUser,
  verifyTotp,
} from '../../_auth.js';
import { createSecureHandler, securityEventLog } from '../../_security.js';

const verifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'MFA code must be a 6-digit value.'),
});

export default createSecureHandler(
  {
    methods: ['POST'],
    auth: 'required',
    csrf: true,
    bodySchema: verifySchema,
    rateLimit: {
      windowMs: 60_000,
      max: 20,
    },
  },
  async (_req, res, { auth, body, requestId, ipAddress }) => {
    const user = findUserById(auth.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No user is associated with this token.',
          requestId,
        },
      });
    }

    const secret = mfaSecretForUser(user);
    if (!secret) {
      return res.status(400).json({
        error: {
          code: 'MFA_NOT_INITIALIZED',
          message: 'Call /api/auth/mfa/setup before verification.',
          requestId,
        },
      });
    }

    const validCode = verifyTotp({ secret, code: body.code });
    if (!validCode) {
      securityEventLog({
        severity: 'warn',
        event: 'mfa_verify_failed',
        requestId,
        ipAddress,
        detail: {
          userId: user.id,
        },
      });

      return res.status(401).json({
        error: {
          code: 'MFA_INVALID_CODE',
          message: 'Provided MFA code is invalid.',
          requestId,
        },
      });
    }

    enableMfaForUser(user);

    securityEventLog({
      event: 'mfa_enabled',
      requestId,
      ipAddress,
      detail: {
        userId: user.id,
      },
    });

    return res.status(200).json({
      mfaEnabled: true,
    });
  },
);
