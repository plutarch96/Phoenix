const crypto = require('crypto');

/**
 * Generate CSRF token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware using Double Submit Cookie pattern
 *
 * This middleware protects against CSRF attacks by:
 * 1. Setting a CSRF token in a cookie (httpOnly for security)
 * 2. Requiring the same token to be sent in request headers
 * 3. Verifying that both tokens match
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints (to allow initial login)
  if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register')) {
    return next();
  }

  // Get token from cookie and header
  const cookieToken = req.cookies?._csrf;
  const headerToken = req.headers['x-csrf-token'] || req.body?._csrf;

  // Verify tokens exist and match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token missing or invalid. Please refresh and try again.'
    });
  }

  next();
};

/**
 * Generate and set CSRF token
 */
const setCsrfToken = (req, res, next) => {
  // Only set token if not already present
  if (!req.cookies?._csrf) {
    const token = generateToken();
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  next();
};

/**
 * Endpoint to get CSRF token for client-side use
 */
const getCsrfToken = (req, res) => {
  const token = req.cookies?._csrf || generateToken();

  // Set cookie if not already set
  if (!req.cookies?._csrf) {
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  res.json({ csrfToken: token });
};

module.exports = {
  csrfProtection,
  setCsrfToken,
  getCsrfToken,
  generateToken
};
