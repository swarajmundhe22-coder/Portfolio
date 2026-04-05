import { findUserById } from '../_auth.js';
import { createSecureHandler } from '../_security.js';

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
    methods: ['GET'],
    auth: 'required',
    rateLimit: {
      windowMs: 60_000,
      max: 100,
    },
  },
  async (_req, res, { auth, requestId }) => {
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

    return res.status(200).json({
      user: toPublicUser(user),
    });
  },
);
