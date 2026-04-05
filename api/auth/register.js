import { z } from 'zod';
import { registerUser } from '../_auth.js';
import { createSecureHandler, securityEventLog } from '../_security.js';

const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: z.string().trim().email('A valid email address is required.'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters.')
    .max(128)
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[0-9]/, 'Password must include a number.')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character.'),
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
    bodySchema: registrationSchema,
    rateLimit: {
      windowMs: 60_000,
      max: 8,
    },
    maxBodyBytes: 50_000,
  },
  async (req, res, { body, requestId, ipAddress }) => {
    try {
      const user = await registerUser({
        name: body.name,
        email: body.email,
        password: body.password,
        role: 'viewer',
      });

      securityEventLog({
        event: 'auth_register_success',
        requestId,
        ipAddress,
        detail: {
          userId: user.id,
          role: user.role,
        },
      });

      return res.status(201).json({
        user: toPublicUser(user),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_REGISTERED') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'An account with this email already exists.',
            requestId,
          },
        });
      }

      throw error;
    }
  },
);
