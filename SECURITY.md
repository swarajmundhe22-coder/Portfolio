# Security Architecture.

This project uses a defense-in-depth backend security model for all serverless API routes.

## Core Security Layers

1. Transport and browser hardening
- TLS is expected to terminate at the hosting edge (Vercel). Configure deployment to enforce TLS 1.3 where available.
- HSTS enabled in production responses: `Strict-Transport-Security`.
- Additional headers applied on all API responses:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`

2. Authentication and session security
- Password hashing with bcrypt (`bcryptjs`) using 12 rounds.
- Short-lived access JWTs (15m) signed with `JWT_ACCESS_SECRET`.
- Refresh-token session model with server-side refresh-session tracking and rotation on each refresh.
- CSRF defense:
  - `csrf_token` cookie
  - `X-CSRF-Token` header validation for mutating protected routes
- Secure cookie settings:
  - `HttpOnly` for refresh token
  - `SameSite=Strict`
  - `Secure` in HTTPS/production environments

3. Multi-factor authentication (MFA)
- TOTP-based MFA setup and verification endpoints:
  - `POST /api/auth/mfa/setup`
  - `POST /api/auth/mfa/verify`
- RFC-style HOTP/TOTP flow implemented using HMAC-SHA1 time-step validation with skew tolerance.

4. Authorization (RBAC and least privilege)
- Route wrapper supports `auth` and `roles` constraints.
- Example admin-only endpoint:
  - `GET /api/auth/telemetry`
- Existing public read routes remain public by design.

5. Input validation and sanitization
- Zod schema validation for sensitive input endpoints:
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/auth/mfa/verify`
  - `/api/contact`
- Recursive payload sanitization removes control characters and common HTML tag vectors.
- Request body size limits enforced per route.

6. Injection and XSS mitigation
- Supabase query builder APIs are used (parameterized path, no raw SQL string interpolation).
- Output handling avoids reflecting raw unsanitized user HTML content.

7. Rate limiting, throttling, and DDoS friction
- Route-level rate limits via shared middleware (`createSecureHandler`).
- Per-IP suspicious activity scoring and temporary IP block windows.
- `Retry-After` and rate-limit headers emitted for client behavior control.

8. Logging and security monitoring
- Structured JSON security-event logging for:
  - registration/login success/failure
  - MFA setup/verification failures
  - rate-limit and suspicious activity events
  - unhandled API exceptions
- Auth/security telemetry aggregate endpoint for admin inspection.

9. Secrets and zero-trust posture
- No secret literals committed in API logic.
- Production requires explicit `JWT_ACCESS_SECRET`.
- Supabase service-role usage guarded by explicit configuration checks.
- Services return `503` when required secret-backed integrations are unavailable.

## Endpoints Added

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/verify`
- `GET /api/auth/telemetry` (admin only)

## Automated Security Checks

- Dependency vulnerability scan:
  - `npm.cmd run security:audit`
- Combined lint + audit sweep:
  - `npm.cmd run security:scan`

## Operational Notes

- The in-memory auth/session store is suitable for local and single-instance runtime verification.
- For production scale, replace in-memory stores with shared persistent stores (Redis/Postgres) and SIEM integration.
- Add managed WAF and edge DDoS controls at infrastructure layer for internet-scale traffic.
