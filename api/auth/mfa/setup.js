import {
  assignPendingMfaSecret,
  buildOtpAuthUri,
  findUserById,
  generateMfaSecret,
} from '../../_auth.js';
import { createSecureHandler, securityEventLog } from '../../_security.js';

export default createSecureHandler(
  {
    methods: ['POST'],
    auth: 'required',
    csrf: true,
    rateLimit: {
      windowMs: 60_000,
      max: 12,
    },
  },
  async (_req, res, { auth, requestId, ipAddress }) => {
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

    const secret = generateMfaSecret();
    assignPendingMfaSecret(user, secret);
    const otpAuthUri = buildOtpAuthUri({
      email: user.email,
      secret,
    });

    securityEventLog({
      event: 'mfa_setup_initialized',
      requestId,
      ipAddress,
      detail: {
        userId: user.id,
      },
    });

    return res.status(200).json({
      secret,
      otpAuthUri,
      message: 'Verify a 6-digit code to activate MFA.',
    });
  },
);
