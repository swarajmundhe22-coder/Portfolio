import { getAuthTelemetrySnapshot } from '../_auth.js';
import { createSecureHandler, getSecurityTelemetrySnapshot } from '../_security.js';

export default createSecureHandler(
  {
    methods: ['GET'],
    auth: 'required',
    roles: ['admin'],
    rateLimit: {
      windowMs: 60_000,
      max: 30,
    },
  },
  async (_req, res) => {
    return res.status(200).json({
      security: getSecurityTelemetrySnapshot(),
      auth: getAuthTelemetrySnapshot(),
    });
  },
);
