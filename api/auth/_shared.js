export const isSecureRequest = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protoValue = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return protoValue === 'https' || process.env.NODE_ENV === 'production';
};

export const authCookieBase = (req) => ({
  path: '/api/auth',
  sameSite: 'Strict',
  secure: isSecureRequest(req),
});
